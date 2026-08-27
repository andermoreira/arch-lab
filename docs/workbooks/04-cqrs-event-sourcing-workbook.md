# Workbook 04: CQRS & Event Sourcing

## 🎯 Pergunta do Módulo
Como reconstruir o saldo exato de uma conta bancária a partir de um log imutável de eventos e como garantir que duas transferências concorrentes não corrompam a versão do agregado?

---

## 🧪 Exercício 1: Append-Only Event Store e Concorrência Otimista

### 1. Objetivo
Executar comandos em uma conta bancária (`BankAccountAggregate`), gravar eventos no `EventStore`, gerar uma projeção de leitura e simular uma colisão de versão concorrente.

### 2. Hipótese
Formule sua previsão:
- *O que o `EventStore` faz quando dois comandos tentam gravar eventos simultaneamente informando a mesma `expectedVersion`?*

### 3. Faça
Execute a suíte de testes de CQRS e Event Sourcing:
```bash
npx vitest run lab/04-cqrs-event-sourcing/cqrs-event-sourcing.test.ts
```

Inspecione os arquivos em [`lab/04-cqrs-event-sourcing/`](file:///Users/andersonalves/dev/arch-lab/lab/04-cqrs-event-sourcing).

### 4. Observe
Veja os eventos `AccountOpened`, `MoneyDeposited`, `MoneyWithdrawn` sendo armazenados em sequência, e a rejeição com erro de `ConcurrencyConflictError` no conflito de versão.

### 5. Reflexão & Gabarito
<details>
<summary>Ver explicação e gabarito</summary>

**Vantagens do Event Sourcing:**
- Auditoria 100% perfeita: nenhum estado é apagado ou sobrescrito.
- Concorrência Otimista com `expectedVersion` impede conflitos de escrita sem a necessidade de locks pessimistas bloqueantes no banco de dados.

</details>
