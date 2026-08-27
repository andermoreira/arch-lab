export interface PackageDefinition {
  name: string;
  totalClasses: number;
  abstractClasses: number;
  dependencies: string[]; // Packages this package depends on (Efferent)
}

export interface PackageMetrics {
  name: string;
  ca: number; // Afferent Coupling
  ce: number; // Efferent Coupling
  instability: number; // I = Ce / (Ca + Ce)
  abstractness: number; // A = Na / Nc
  distanceFromMainSequence: number; // D = |A + I - 1|
  classification: 'MAIN_SEQUENCE' | 'ZONE_OF_PAIN' | 'ZONE_OF_USELESSNESS';
}

export class ModularityAnalyzer {
  public static calculateMetrics(packages: PackageDefinition[]): PackageMetrics[] {
    const afferentMap = new Map<string, number>();

    // Initialize afferent counts
    for (const pkg of packages) {
      afferentMap.set(pkg.name, 0);
    }

    // Compute Afferent Coupling (who depends on pkg)
    for (const pkg of packages) {
      for (const dep of pkg.dependencies) {
        if (afferentMap.has(dep)) {
          afferentMap.set(dep, (afferentMap.get(dep) || 0) + 1);
        }
      }
    }

    return packages.map((pkg) => {
      const ca = afferentMap.get(pkg.name) || 0;
      const ce = pkg.dependencies.length;
      const totalCoupling = ca + ce;

      const instability = totalCoupling === 0 ? 0 : Number((ce / totalCoupling).toFixed(3));
      const abstractness = pkg.totalClasses === 0 ? 0 : Number((pkg.abstractClasses / pkg.totalClasses).toFixed(3));
      const distance = Number(Math.abs(abstractness + instability - 1).toFixed(3));

      let classification: 'MAIN_SEQUENCE' | 'ZONE_OF_PAIN' | 'ZONE_OF_USELESSNESS' = 'MAIN_SEQUENCE';
      if (instability < 0.3 && abstractness < 0.3) {
        classification = 'ZONE_OF_PAIN';
      } else if (instability > 0.7 && abstractness > 0.7) {
        classification = 'ZONE_OF_USELESSNESS';
      }

      return {
        name: pkg.name,
        ca,
        ce,
        instability,
        abstractness,
        distanceFromMainSequence: distance,
        classification,
      };
    });
  }

  /**
   * Verifies the Stable Dependencies Principle (SDP):
   * A package should only depend on packages that are more stable than itself.
   */
  public static verifySDP(
    packages: PackageDefinition[],
    metrics: PackageMetrics[]
  ): Array<{ source: string; target: string; violation: string }> {
    const metricMap = new Map(metrics.map((m) => [m.name, m]));
    const violations: Array<{ source: string; target: string; violation: string }> = [];

    for (const pkg of packages) {
      const sourceMetric = metricMap.get(pkg.name);
      if (!sourceMetric) continue;

      for (const dep of pkg.dependencies) {
        const targetMetric = metricMap.get(dep);
        if (targetMetric && sourceMetric.instability < targetMetric.instability) {
          violations.push({
            source: pkg.name,
            target: dep,
            violation: `SDP Violation: '${pkg.name}' (I=${sourceMetric.instability}) depends on less stable '${dep}' (I=${targetMetric.instability})`,
          });
        }
      }
    }

    return violations;
  }
}
