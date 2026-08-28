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

      // A classificação correta é baseada na DISTÂNCIA da Sequência Principal (D),
      // não em limiares crus de I e A. Um pacote com I=0.5/A=0.1 tem D=0.4 (bem
      // longe da sequência) e é doloroso — mas os limiares antigos (I<0.3 && A<0.3)
      // o classificariam como MAIN_SEQUENCE, escondendo o problema.
      //
      // Perto da sequência (D pequeno) => saudável. Longe da sequência, a direção
      // de I decide a patologia:
      //   - I baixo + A baixo (canto inferior esquerdo): estável e concreto => DOR
      //     (difícil de mudar, muitos dependem, nada abstrato para estender).
      //   - I alto + A alto (canto superior direito): instável e abstrato => INÚTIL
      //     (abstrações que ninguém usa).
      const MAIN_SEQUENCE_TOLERANCE = 0.3; // banda em torno de A + I = 1
      let classification: 'MAIN_SEQUENCE' | 'ZONE_OF_PAIN' | 'ZONE_OF_USELESSNESS' = 'MAIN_SEQUENCE';
      if (distance > MAIN_SEQUENCE_TOLERANCE) {
        classification = instability + abstractness < 1 ? 'ZONE_OF_PAIN' : 'ZONE_OF_USELESSNESS';
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
   * Deriva a Abstractness (A = Na / Nc) a partir de código-fonte TypeScript real,
   * em vez de números fornecidos à mão.
   *
   * "Elemento abstrato" aqui = `interface` ou `abstract class` (contratos que não
   * podem ser instanciados diretamente). "Elemento concreto" = `class` não
   * abstrata. A = elementos abstratos / total de elementos.
   *
   * É uma contagem sintática (regex) suficiente para o propósito didático: o
   * aluno vê a métrica emergir do código, não de uma constante escolhida a dedo.
   */
  public static deriveAbstractnessFromSource(source: string): {
    abstractCount: number;
    totalCount: number;
    abstractness: number;
  } {
    // Remove comentários de linha e de bloco para não contar exemplos comentados.
    const stripped = source
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/[^\n]*/g, '');

    const interfaceCount = (stripped.match(/\binterface\s+[A-Za-z_$][\w$]*/g) || []).length;
    const abstractClassCount = (stripped.match(/\babstract\s+class\s+[A-Za-z_$][\w$]*/g) || []).length;

    // Todas as classes (abstratas ou não). Subtraímos as abstratas para achar as concretas.
    const allClassCount = (stripped.match(/\bclass\s+[A-Za-z_$][\w$]*/g) || []).length;
    const concreteClassCount = allClassCount - abstractClassCount;

    const abstractCount = interfaceCount + abstractClassCount;
    const totalCount = interfaceCount + abstractClassCount + concreteClassCount;
    const abstractness = totalCount === 0 ? 0 : Number((abstractCount / totalCount).toFixed(3));

    return { abstractCount, totalCount, abstractness };
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
