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
