import { describe, it, expect } from 'vitest';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FitnessRuleEngine, type LayerRule } from './fitness-rules.js';

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
});
