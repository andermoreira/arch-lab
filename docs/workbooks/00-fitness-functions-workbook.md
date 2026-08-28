# Workbook 00: Fitness Functions & Governança Automatizada

## 🎯 Pergunta Condutora do Módulo
*Como garantir que dezenas de engenheiros em múltiplos times nunca importem drivers de banco de dados ou bibliotecas de transporte dentro das entidades de domínio sem depender de revisões de código manuais?*

---

## 🧪 Exercício 1: O Fenômeno da Violação de Camadas (Tainted Domain)

### 1. Objetivo
Observar em tempo real a detecção de uma violação arquitetural grave: uma entidade de domínio importando o cliente `pg` (PostgreSQL) e o framework `express`.

### 2. Hipótese
Analise os dois módulos de código:
- **Domínio Limpo:** [`lab/00-fitness-functions/sample-codebase/clean-domain/order.ts`](file:///Users/andersonalves/dev/arch-lab/lab/00-fitness-functions/sample-codebase/clean-domain/order.ts) (contém apenas lógica de domínio pura em TypeScript).
- **Domínio Contaminado:** [`lab/00-fitness-functions/sample-codebase/tainted-domain/corrupted-order.ts`](file:///Users/andersonalves/dev/arch-lab/lab/00-fitness-functions/sample-codebase/tainted-domain/corrupted-order.ts) (importa `pg` e `express`).

Formule sua hipótese:
- ( ) O compilador do TypeScript acusará erro de sintaxe e impedirá o build.
- ( ) O compilador do TypeScript compilará normalmente com sucesso, mas a **Fitness Function** rejeitará o arquivo corrompido, listando `pg` e `express` como violações de fronteira proibidas.

### 3. Faça
Execute o teste de Fitness Functions via Vitest:
```bash
npm run test:arch
```

Inspecione o teste em [`lab/00-fitness-functions/fitness-functions.test.ts`](file:///Users/andersonalves/dev/arch-lab/lab/00-fitness-functions/fitness-functions.test.ts).

### 4. Observe
Veja que o teste executa o analisador de AST sobre o código fonte:
- `clean-domain/order.ts` é aprovado com **0 violações**.
- `tainted-domain/corrupted-order.ts` é rejeitado com **2 violações de gravidade ALTA**: imports proibidos `pg` e `express`.

### 5. Reflexão & Gabarito
<details>
<summary>🔍 Diagnóstico Arquitetural Profundo & Mecânica Interna</summary>

**Por que o compilador não pega, mas a Fitness Function sim?**
O TypeScript só valida tipagem de dados. Para ele, importar `pg` em qualquer lugar é sintaticamente válido se a tipagem bater.
No entanto, do ponto de vista de **Arquitetura de Software**:
1. **Acoplamento Tecnológico:** Se a entidade `Order` depende de `pg`, você não consegue testá-la em memória sem mockar o driver C/C++ do PostgreSQL.
2. **Erosão da Arquitetura (*Architectural Drift*):** Desenvolvedores começam a escrever queries SQL dentro dos métodos de negócio, destruindo a testabilidade e impedindo a migração para outros bancos (ex: DynamoDB ou MongoDB).
3. **Fitness Functions como Guardiões do CI:** Ao incluir `npm run test:arch` no pipeline de CI/CD, nenhum PR com violação de camada consegue ser mergeado.
</details>

---

## 🧪 Exercício 2: Detecção de Ciclos de Dependência entre Módulos

### 1. Objetivo
Comprovar matematicamente como um ciclo de dependência ($A \to B \to C \to A$) funde múltiplos módulos independentes em um único monólito tóxico.

### 2. Hipótese
Considere um grafo de pacotes onde o módulo `Orders` importa `Payments`, `Payments` importa `Shipping`, e `Shipping` importa `Orders`:
- ( ) Cada módulo ainda pode ser extraído para um microsserviço isolado sem afetar os outros.
- ( ) Cria-se um ciclo fechado onde nenhuma alteração ou release pode ser feito isoladamente, violando o Princípio de Dependências Acíclicas (ADP).

### 3. Faça
Inspecione o algoritmo de detecção de ciclos em [`lab/00-fitness-functions/fitness-rules.ts`](file:///Users/andersonalves/dev/arch-lab/lab/00-fitness-functions/fitness-rules.ts) e execute o teste correspondente:
```bash
npx vitest run -t "cycle" lab/00-fitness-functions/fitness-functions.test.ts
```

### 4. Observe
O algoritmo baseado em DFS (Depth-First Search com coloração de vértices) identifica e aponta o caminho exato do ciclo: `Orders -> Payments -> Shipping -> Orders`.

### 5. Reflexão & Gabarito
<details>
<summary>🔍 Diagnóstico Arquitetural Profundo & Mecânica Interna</summary>

**A Regra das Dependências Acíclicas (ADP):**
O grafo de dependência entre pacotes DEVE ser um **Grafo Acíclico Dirigido (DAG)**. 
Para quebrar o ciclo $A \to B \to C \to A$, o arquiteto tem duas soluções canônicas:
1. **Inversão de Dependências (DIP):** Fazer com que $C$ dependa de uma interface (Porta) definida em $C$, implementada por um adaptador fora do ciclo.
2. **Eventos de Domínio:** Fazer com que $C$ emita um evento assíncrono (`ShipmentCreatedEvent`) em vez de chamar diretamente o módulo $A$.
</details>
