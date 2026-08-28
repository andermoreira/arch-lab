import { describe, it, expect } from 'vitest';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FitnessRuleEngine, type LayerRule } from '../00-fitness-functions/fitness-rules.js';

/**
 * Fitness Function do Capstone (fecha a espiral curricular).
 *
 * O AGENTS.md promete, na Fase 8, "Fitness Functions impedindo vazamento de
 * infraestrutura". Aqui reaproveitamos o MOTOR de regras construído na Fase 0 e
 * o apontamos para a árvore real do capstone, garantindo que os três Bounded
 * Contexts (orders, inventory, payments) mantenham a Regra da Dependência:
 *   - o núcleo de domínio não conhece adapters, drivers de banco nem frameworks;
 *   - as portas (contratos) não dependem de adapters concretos.
 *
 * Se um futuro commit fizer um agregado importar `pg` ou um adapter, este teste
 * quebra o build — governança arquitetural automatizada, não revisão manual.
 */
describe('Fase 8: Capstone Architecture Fitness Function (no infrastructure leak)', () => {
  const __filename = fileURLToPath(import.meta.url);
  const capstoneDir = path.dirname(__filename);

  const domainPurityRule: LayerRule = {
    name: 'CAPSTONE_DOMAIN_PURITY',
    // Qualquer arquivo dentro de uma pasta domain/ de qualquer bounded context.
    sourcePattern: /[\\/]domain[\\/]/,
    forbiddenImportPatterns: [
      /^pg$/,
      /^ioredis$/,
      /^express$/,
      /[\\/]adapters[\\/]/, // domínio não importa adapter concreto
      /[\\/]saga[\\/]/, // domínio não conhece o orquestrador
    ],
    description: 'Domain aggregates must not depend on adapters, DB drivers, frameworks or the saga',
  };

  const portPurityRule: LayerRule = {
    name: 'CAPSTONE_PORT_PURITY',
    sourcePattern: /[\\/]ports[\\/]/,
    forbiddenImportPatterns: [
      /^pg$/,
      /^ioredis$/,
      /^express$/,
      /[\\/]adapters[\\/]/, // porta é contrato: não depende do adapter que a implementa
    ],
    description: 'Ports must remain pure contracts, free of concrete adapter dependencies',
  };

  it('should not find any infrastructure leak across the capstone bounded contexts', () => {
    const files = FitnessRuleEngine.scanDirectory(capstoneDir);

    // Sanidade: o scanner realmente encontrou os módulos do capstone.
    expect(files.length).toBeGreaterThanOrEqual(10);

    const violations = FitnessRuleEngine.evaluateRules(files, [domainPurityRule, portPurityRule]);

    // Mensagem legível caso alguém introduza um vazamento no futuro.
    expect(violations, violations.map((v) => v.message).join('\n')).toHaveLength(0);
  });

  it('should catch a simulated infrastructure leak injected into the domain layer', () => {
    // Prova que a fitness function realmente morde: um agregado fictício que
    // importa o driver de banco diretamente é reprovado.
    const leakingSource = "import { Pool } from 'pg';\nexport class LeakyAggregate {}";
    const imports = FitnessRuleEngine.extractImportsFromSource(leakingSource);

    const violates = imports.some((imp) =>
      domainPurityRule.forbiddenImportPatterns.some((p) => p.test(imp.importPath))
    );

    expect(violates).toBe(true);
  });
});
