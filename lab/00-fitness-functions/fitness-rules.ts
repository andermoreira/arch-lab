import * as fs from 'node:fs';
import * as path from 'node:path';

export interface ArchitectureViolation {
  file: string;
  line: number;
  forbiddenImport: string;
  ruleName: string;
  message: string;
}

export interface LayerRule {
  name: string;
  sourcePattern: RegExp;
  forbiddenImportPatterns: RegExp[];
  description: string;
}

export class FitnessRuleEngine {
  /**
   * Scans all TypeScript files in a directory recursively.
   */
  public static scanDirectory(dir: string): string[] {
    let results: string[] = [];
    if (!fs.existsSync(dir)) return results;

    const list = fs.readdirSync(dir);
    for (const file of list) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        results = results.concat(this.scanDirectory(fullPath));
      } else if (file.endsWith('.ts') && !file.endsWith('.test.ts') && !file.endsWith('.spec.ts')) {
        results.push(fullPath);
      }
    }
    return results;
  }

  /**
   * Extracts all import/require statements from source code with line numbers.
   */
  public static extractImports(filePath: string): Array<{ line: number; importPath: string }> {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const imports: Array<{ line: number; importPath: string }> = [];

    const importRegex = /(?:import\s+(?:[\w*\s{},]+from\s+)?['"]([^'"]+)['"]|require\(['"]([^'"]+)['"]\))/;

    lines.forEach((lineText, index) => {
      const match = importRegex.exec(lineText);
      if (match) {
        const importTarget = match[1] || match[2];
        if (importTarget) {
          imports.push({ line: index + 1, importPath: importTarget });
        }
      }
    });

    return imports;
  }

  /**
   * Evaluates layer rules against a set of files and returns all violations.
   */
  public static evaluateRules(files: string[], rules: LayerRule[]): ArchitectureViolation[] {
    const violations: ArchitectureViolation[] = [];

    for (const file of files) {
      const imports = this.extractImports(file);

      for (const rule of rules) {
        if (rule.sourcePattern.test(file)) {
          for (const imp of imports) {
            for (const forbiddenPattern of rule.forbiddenImportPatterns) {
              if (forbiddenPattern.test(imp.importPath)) {
                violations.push({
                  file,
                  line: imp.line,
                  forbiddenImport: imp.importPath,
                  ruleName: rule.name,
                  message: `[${rule.name}] File "${file}" (line ${imp.line}) violates rule: ${rule.description}. Forbidden import: "${imp.importPath}"`,
                });
              }
            }
          }
        }
      }
    }

    return violations;
  }
}
