# Workbook 06: Transações Distribuídas & O Padrão Saga

## 🎯 Pergunta Condutora do Módulo
*Por que o Two-Phase Commit (2PC) bloqueia bancos de dados sob alta concorrência na nuvem, e como uma Saga Orquestrada com Transações Compensatórias garante consistência em falhas de pagamento sem travar recursos?*

---

## 🧪 Exercício 1: O Fenômeno da Falha com Compensação Transacional

### 1. Objetivo
Executar um fluxo de compra corporativo de 3 etapas (1. Criar Pedido $\to$ 2. Reservar Estoque $\to$ 3. Processar Pagamento) onde o pagamento falha, observando a Máquina de Estados disparar o rollback semântico das etapas anteriores.

### 2. Hipótese
Formule sua previsão:
- ( ) Se o pagamento for recusado por saldo insuficiente, o estoque reservado permanecerá bloqueado indefinidamente.
- ( ) O Orquestrador de Saga capturará a falha de pagamento, entrará no estado `COMPENSATING` e executará `InventoryService.releaseStock()`, restaurando o estoque original e marcando o pedido como `CANCELLED`.

### 3. Faça
Execute a suíte de testes de Sagas Distribuídas:
```bash
npx vitest run lab/06-distributed-sagas/saga.test.ts
```

Inspecione os arquivos em [`lab/06-distributed-sagas/`](../../lab/06-distributed-sagas).

### 4. Observe
Veja os logs da Máquina de Estados da Saga:
1. `[STEP 1] OrderCreated` $\to$ Status: PENDING
2. `[STEP 2] InventoryReserved` $\to$ Estoque decrementado
3. `[STEP 3] PaymentFailed` (Saldo Insuficiente)
4. `[COMPENSATION] Releasing inventory...` $\to$ Estoque devolvido
5. `[COMPENSATION] Cancelling order...` $\to$ Status: CANCELLED

### 5. Reflexão & Gabarito
<details>
<summary>🔍 Diagnóstico Arquitetural Profundo & Mecânica Interna</summary>

**Por que não usar 2PC (Two-Phase Commit)?**
O protocolo 2PC exige que todos os nós participantes mantenham locks de linha abertos até que o coordenador confirme a fase 2. Se a rede oscilar, o banco inteiro fica travado.
A **Saga** substitui locks de baixo nível por:
1. **Transações Locais Imediatas:** Cada microsserviço comita sua parte no próprio banco sem esperar pelos outros.
2. **Transações Compensatórias:** Se uma etapa futura falhar, o orquestrador invoca funções de compensação explícitas para desfazer as etapas que já foram comitadas.
</details>

---

## 🧪 Exercício 2: Orquestração vs Coreografia

### 1. Objetivo
Comparar a visibilidade de processos de negócio gerenciados por um Orquestrador central com Máquina de Estados versus eventos coreografados descentralizados.

### 2. Hipótese
Em um fluxo complexo com 8 passos de aprovação:
- ( ) Coreografia é superior porque nenhum serviço sabe do outro.
- ( ) Orquestração é superior porque centraliza a Máquina de Estados, timeouts e diagnósticos de erro, evitando tempestades de eventos (*Event Vortex*) onde ninguém sabe em qual etapa a transação travou.

### 3. Faça
Inspecione a implementação da máquina de estados em [`lab/06-distributed-sagas/saga-orchestrator.ts`](../../lab/06-distributed-sagas/saga-orchestrator.ts).

### 4. Observe
O orquestrador registra cada transição em seu log de auditoria, permitindo retries automáticos ou intervenção manual em caso de falha catastrófica de rede.

### 5. Reflexão & Gabarito
<details>
<summary>🔍 Diagnóstico Arquitetural Profundo & Mecânica Interna</summary>

**Trade-off Clássico de Arquitetura:**
- **Coreografia:** Excelente para fluxos simples de 2 a 3 etapas com baixo acoplamento.
- **Orquestração:** Mandatória para processos financeiros críticos com regras complexas de compensação e exigência de observabilidade ponta a ponta.
</details>

---

## ✅ Critério de pronto

Você domina este módulo quando `npx vitest run lab/06-distributed-sagas/saga.test.ts` passa, `npm run lint` valida sem erros e você explica, sem reabrir o gabarito, em que ponto a sua hipótese divergiu do observado em cada exercício.
