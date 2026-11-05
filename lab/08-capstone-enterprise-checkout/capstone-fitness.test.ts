import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
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

  it('should catch an infrastructure leak written into a domain/ folder (end to end through evaluateRules)', () => {
    // Prova que a fitness function realmente morde: um agregado fictício num
    // diretório domain/ que importa o driver de banco é reprovado pelo motor.
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'arch-lab-leak-'));
    try {
      const domainDir = path.join(root, 'orders', 'domain');
      fs.mkdirSync(domainDir, { recursive: true });
      const leaky = path.join(domainDir, 'leaky.aggregate.ts');
      fs.writeFileSync(leaky, "import { Pool } from 'pg';\nexport class LeakyAggregate {}\n");

      const violations = FitnessRuleEngine.evaluateRules([leaky], [domainPurityRule, portPurityRule]);

      expect(violations).toHaveLength(1);
      expect(violations[0]?.ruleName).toBe('CAPSTONE_DOMAIN_PURITY');
      expect(violations[0]?.forbiddenImport).toBe('pg');
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
});
