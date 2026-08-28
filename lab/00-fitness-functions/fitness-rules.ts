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
   *
   * Um scanner de fronteiras arquiteturais precisa enxergar TODAS as formas de
   * dependência entre módulos, não só o `import ... from` de uma linha. Um regex
   * ingênuo (linha a linha) deixa passar violações reais:
   *   - import multi-linha (`import {\n  A,\n} from 'pg'`)
   *   - re-export que também é dependência (`export { X } from 'pg'`)
   *   - import só de tipo (`import type { T } from 'pg'`)
   *   - import dinâmico (`await import('pg')`)
   *
   * Estratégia: normalizamos os offsets em linhas uma vez e varremos o CONTEÚDO
   * inteiro (não cada linha isolada) com regexes tolerantes a quebras de linha,
   * mapeando cada match de volta para a linha onde o `import/export/require`
   * começa. É a versão "análise de grafo de imports" prometida no AGENTS.md, sem
   * puxar um parser de AST completo para dentro do lab.
   */
  public static extractImports(filePath: string): Array<{ line: number; importPath: string }> {
    const content = fs.readFileSync(filePath, 'utf-8');
    return this.extractImportsFromSource(content);
  }

  /** Núcleo testável do extractImports, operando sobre o conteúdo cru. */
  public static extractImportsFromSource(
    content: string
  ): Array<{ line: number; importPath: string }> {
    const imports: Array<{ line: number; importPath: string }> = [];
    const seen = new Set<string>();

    // Índices de início de cada linha para converter offset -> nº da linha.
    const lineStarts: number[] = [0];
    for (let i = 0; i < content.length; i += 1) {
      if (content[i] === '\n') lineStarts.push(i + 1);
    }
    const lineOf = (offset: number): number => {
      // Busca binária pela última linha cujo início <= offset.
      let lo = 0;
      let hi = lineStarts.length - 1;
      while (lo < hi) {
        const mid = (lo + hi + 1) >> 1;
        if (lineStarts[mid] <= offset) lo = mid;
        else hi = mid - 1;
      }
      return lo + 1;
    };

    const record = (offset: number, importPath: string): void => {
      const line = lineOf(offset);
      const key = `${line}::${importPath}`;
      if (!seen.has(key)) {
        seen.add(key);
        imports.push({ line, importPath });
      }
    };

    // `import ... from '...'` e `export ... from '...'` (o `[\s\S]*?` cruza
    // quebras de linha, cobrindo imports/re-exports multi-linha e `import type`).
    const staticRegex = /\b(?:import|export)\b[\s\S]*?\bfrom\s*['"]([^'"]+)['"]/g;
    // `import '...'` (side-effect only, sem `from`).
    const bareImportRegex = /\bimport\s*['"]([^'"]+)['"]/g;
    // `import('...')` dinâmico e `require('...')`.
    const dynamicRegex = /\b(?:import|require)\s*\(\s*['"]([^'"]+)['"]\s*\)/g;

    for (const regex of [staticRegex, bareImportRegex, dynamicRegex]) {
      let match: RegExpExecArray | null;
      while ((match = regex.exec(content)) !== null) {
        record(match.index, match[1]);
      }
    }

    imports.sort((a, b) => a.line - b.line);
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
