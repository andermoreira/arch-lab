import { describe, it, expect } from 'vitest';
import { ModularityAnalyzer, type PackageDefinition } from './modularity-analyzer.js';

describe('Fase 1: Modularity & Coupling Metrics (Robert C. Martin)', () => {
  it('should calculate Ca, Ce, Instability, Abstractness and Distance correctly', () => {
    const packages: PackageDefinition[] = [
      {
        name: 'domain-core',
        totalClasses: 10,
        abstractClasses: 9,
        dependencies: [], // Depends on nothing
      },
      {
        name: 'usecases',
        totalClasses: 8,
        abstractClasses: 4,
        dependencies: ['domain-core'],
      },
      {
        name: 'postgres-adapter',
        totalClasses: 5,
        abstractClasses: 0,
        dependencies: ['domain-core', 'usecases'],
      },
    ];

    const metrics = ModularityAnalyzer.calculateMetrics(packages);

    const domainMetric = metrics.find((m) => m.name === 'domain-core')!;
    expect(domainMetric.ca).toBe(2);
    expect(domainMetric.ce).toBe(0);
    expect(domainMetric.instability).toBe(0.0); // Maximally stable
    expect(domainMetric.abstractness).toBe(0.9);
    expect(domainMetric.distanceFromMainSequence).toBeLessThanOrEqual(0.1);

    const adapterMetric = metrics.find((m) => m.name === 'postgres-adapter')!;
    expect(adapterMetric.ca).toBe(0);
    expect(adapterMetric.ce).toBe(2);
    expect(adapterMetric.instability).toBe(1.0); // Maximally unstable / flexible
    expect(adapterMetric.abstractness).toBe(0.0);
    expect(adapterMetric.distanceFromMainSequence).toBe(0.0); // On main sequence
  });

  it('should detect Zone of Pain for concrete stable packages', () => {
    const packages: PackageDefinition[] = [
      {
        name: 'concrete-global-util',
        totalClasses: 10,
        abstractClasses: 0, // A = 0
        dependencies: [], // Ce = 0 => I = 0
      },
      {
        name: 'module-a',
        totalClasses: 5,
        abstractClasses: 1,
        dependencies: ['concrete-global-util'],
      },
      {
        name: 'module-b',
        totalClasses: 5,
        abstractClasses: 1,
        dependencies: ['concrete-global-util'],
      },
    ];

    const metrics = ModularityAnalyzer.calculateMetrics(packages);
    const utilMetric = metrics.find((m) => m.name === 'concrete-global-util')!;

    expect(utilMetric.classification).toBe('ZONE_OF_PAIN');
    // D = |A + I - 1| = |0 + 0 - 1| = 1.0 -> distância máxima da sequência.
    expect(utilMetric.distanceFromMainSequence).toBe(1.0);
  });

  it('should classify a package by its Distance (D), not by raw I/A thresholds', () => {
    // Pacote parcialmente estável e quase concreto: I=0.5, A=0.1.
    // D = |0.1 + 0.5 - 1| = 0.4 -> longe da sequência, claramente doloroso.
    // Os limiares antigos (I<0.3 && A<0.3) o classificariam como MAIN_SEQUENCE.
    const packages: PackageDefinition[] = [
      {
        name: 'painful-mid',
        totalClasses: 10,
        abstractClasses: 1, // A = 0.1
        dependencies: ['libX'], // Ce = 1
      },
      {
        name: 'libX',
        totalClasses: 3,
        abstractClasses: 0,
        dependencies: [],
      },
      // Um dependente de painful-mid para dar Ca = 1 => I = Ce/(Ca+Ce) = 1/2 = 0.5
      {
        name: 'consumer',
        totalClasses: 2,
        abstractClasses: 0,
        dependencies: ['painful-mid'],
      },
    ];

    const metrics = ModularityAnalyzer.calculateMetrics(packages);
    const painful = metrics.find((m) => m.name === 'painful-mid')!;

    expect(painful.instability).toBe(0.5);
    expect(painful.abstractness).toBe(0.1);
    expect(painful.distanceFromMainSequence).toBe(0.4);
    // Antes caía em MAIN_SEQUENCE; agora a distância revela a dor.
    expect(painful.classification).toBe('ZONE_OF_PAIN');
  });

  it('should derive Abstractness (A) from real TypeScript source, not from hand-fed numbers', () => {
    // 2 interfaces + 1 abstract class = 3 abstratos; 1 classe concreta.
    // A = 3 / 4 = 0.75. Comentário com "class Fake" NÃO deve ser contado.
    const source = `
      // class CommentShouldBeIgnored {}
      export interface Repository {}
      export interface Notifier {}
      export abstract class BaseUseCase {}
      export class PostgresRepository implements Repository {}
    `;

    const result = ModularityAnalyzer.deriveAbstractnessFromSource(source);

    expect(result.abstractCount).toBe(3);
    expect(result.totalCount).toBe(4);
    expect(result.abstractness).toBe(0.75);
  });

  it('should derive Abstractness = 0 for a purely concrete package (Zone of Pain risk)', () => {
    const source = `
      export class Helper {}
      export class Formatter {}
    `;
    const result = ModularityAnalyzer.deriveAbstractnessFromSource(source);
    expect(result.abstractness).toBe(0);
    expect(result.totalCount).toBe(2);
  });

  it('should detect violations of Stable Dependencies Principle (SDP)', () => {
    const packages: PackageDefinition[] = [
      {
        name: 'stable-core',
        totalClasses: 10,
        abstractClasses: 8,
        dependencies: ['unstable-plugin'], // VIOLATION: Stable core (I=0.25) depends on unstable plugin (I=0.75)
      },
      {
        name: 'unstable-plugin',
        totalClasses: 4,
        abstractClasses: 0,
        dependencies: ['third-party-sdk-a', 'third-party-sdk-b', 'third-party-sdk-c'],
      },
      {
        name: 'consumer-app-1',
        totalClasses: 2,
        abstractClasses: 0,
        dependencies: ['stable-core'],
      },
      {
        name: 'consumer-app-2',
        totalClasses: 2,
        abstractClasses: 0,
        dependencies: ['stable-core'],
      },
      {
        name: 'consumer-app-3',
        totalClasses: 2,
        abstractClasses: 0,
        dependencies: ['stable-core'],
      },
    ];

    const metrics = ModularityAnalyzer.calculateMetrics(packages);
    const violations = ModularityAnalyzer.verifySDP(packages, metrics);

    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0].source).toBe('stable-core');
    expect(violations[0].target).toBe('unstable-plugin');
  });
});
