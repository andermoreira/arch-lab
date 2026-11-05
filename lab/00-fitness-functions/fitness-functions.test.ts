import { describe, it, expect } from 'vitest';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FitnessRuleEngine, type LayerRule, type ArchitectureViolation } from './fitness-rules.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Fase 0: Architecture Fitness Functions & Governance', () => {
  const sampleDir = path.join(__dirname, 'sample-codebase');

  const domainRule: LayerRule = {
    name: 'DOMAIN_PURITY_RULE',
    sourcePattern: /[\\/].*domain.*[\\/]/,
    forbiddenImportPatterns: [/^pg$/, /^express$/, /^ioredis$/, /[\\/]infrastructure[\\/]/],
    description: 'Domain layer must NOT import infrastructure, frameworks or DB drivers',
  };

  it('should pass cleanly for pure domain entities without infrastructure leaks', () => {
    const cleanFiles = [path.join(sampleDir, 'clean-domain', 'order.ts')];
    const violations = FitnessRuleEngine.evaluateRules(cleanFiles, [domainRule]);

    expect(violations).toHaveLength(0);
  });

  it('should detect deliberate architectural violations in tainted domain entity', () => {
    const taintedFiles = [path.join(sampleDir, 'tainted-domain', 'corrupted-order.ts')];
    const violations = FitnessRuleEngine.evaluateRules(taintedFiles, [domainRule]);

    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0].forbiddenImport).toBe('pg');
    expect(violations[0].ruleName).toBe('DOMAIN_PURITY_RULE');
  });

  it('should scan entire codebase for architecture regressions', () => {
    const allFiles = FitnessRuleEngine.scanDirectory(sampleDir);
    expect(allFiles.length).toBeGreaterThanOrEqual(3);

    const violations = FitnessRuleEngine.evaluateRules(allFiles, [domainRule]);
    // Exactly one violation expected (the corrupted-order sample)
    expect(violations).toHaveLength(1);
    expect(violations[0].file).toContain('corrupted-order.ts');
  });

  describe('Robust import graph analysis (why a per-line regex is not enough)', () => {
    // Fonte de domínio "esperta" que esconde suas dependências de infraestrutura
    // nas exatas formas que um scanner ingênuo (linha a linha) deixaria passar.
    const sneakyDomainSource = [
      "import {",
      "  Pool,",
      "  type PoolClient,",
      "} from 'pg';", // (1) import multi-linha
      "import type { Redis } from 'ioredis';", // (2) import só de tipo
      "export { buildRouter } from 'express';", // (3) re-export que é dependência
      "",
      "export async function lazyLeak() {",
      "  const mod = await import('pg'); // (4) import dinâmico",
      "  return mod;",
      "}",
    ].join('\n');

    it('should detect imports that a naive line-by-line regex would miss', () => {
      const imports = FitnessRuleEngine.extractImportsFromSource(sneakyDomainSource);
      const targets = imports.map((i) => i.importPath);

      // Todas as 4 formas de dependência são capturadas.
      expect(targets).toContain('pg'); // multi-linha + dinâmico
      expect(targets).toContain('ioredis'); // type-only
      expect(targets).toContain('express'); // re-export
    });

    it('should map a multi-line import back to the line where it starts', () => {
      const imports = FitnessRuleEngine.extractImportsFromSource(sneakyDomainSource);
      const pgStatic = imports.find((i) => i.importPath === 'pg' && i.line === 1);
      expect(pgStatic).toBeDefined(); // o `import {` começa na linha 1
    });

    it('should flag a domain file that leaks infrastructure via re-export and type-only import', () => {
      const domainRuleStrict: LayerRule = {
        name: 'DOMAIN_PURITY_STRICT',
        sourcePattern: /.*/, // avalia a fonte fornecida diretamente
        forbiddenImportPatterns: [/^pg$/, /^express$/, /^ioredis$/],
        description: 'Domain must not depend on DB drivers or web frameworks in any import form',
      };

      // Reaproveita o motor de regras sobre os imports extraídos da fonte crua.
      const imports = FitnessRuleEngine.extractImportsFromSource(sneakyDomainSource);
      const violations: ArchitectureViolation[] = imports.flatMap((imp) =>
        domainRuleStrict.forbiddenImportPatterns.some((p) => p.test(imp.importPath))
          ? [
              {
                file: 'sneaky-domain.ts',
                line: imp.line,
                forbiddenImport: imp.importPath,
                ruleName: domainRuleStrict.name,
                message: domainRuleStrict.description,
              },
            ]
          : []
      );

      const leaked = violations.map((v) => v.forbiddenImport);
      expect(leaked).toContain('pg');
      expect(leaked).toContain('ioredis');
      expect(leaked).toContain('express');
    });
  });

  describe('Dependency cycle detection (ADP)', () => {
    it('reports the exact path of a cycle Orders -> Payments -> Shipping -> Orders', () => {
      const cycles = FitnessRuleEngine.findDependencyCycles({
        Orders: ['Payments'],
        Payments: ['Shipping'],
        Shipping: ['Orders'],
      });

      expect(cycles).toEqual([['Orders', 'Payments', 'Shipping', 'Orders']]);
    });

    it('returns no cycle for an acyclic dependency graph (a DAG)', () => {
      const cycles = FitnessRuleEngine.findDependencyCycles({
        Orders: ['Payments', 'Shipping'],
        Payments: ['Shipping'],
        Shipping: [],
      });

      expect(cycles).toEqual([]);
    });

    it('detects a self-dependency and ignores modules that only appear as targets', () => {
      const cycles = FitnessRuleEngine.findDependencyCycles({ Billing: ['Billing', 'Ledger'] });

      expect(cycles).toEqual([['Billing', 'Billing']]);
    });
  });
});
