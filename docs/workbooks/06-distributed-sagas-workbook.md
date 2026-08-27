# Workbook 06: Transações Distribuídas & O Padrão Saga

## 🎯 Pergunta do Módulo
Como garantir que uma transação envolvendo Pedidos, Estoque e Pagamentos seja revertida de forma consistente se o cartão de crédito do cliente for recusado, sem deixar estoque preso?

---

## 🧪 Exercício 1: Executando Sagas com Compensação Automática

### 1. Objetivo
Executar um fluxo de checkout onde o pagamento falha, observando o Orquestrador disparar a transação compensatória de liberação de estoque.

### 2. Hipótese
Formule sua previsão:
- *Em qual estado o estoque e o pedido devem terminar após a falha de pagamento na Saga?*

### 3. Faça
Execute o teste do orquestrador de Saga:
```bash
npx vitest run lab/06-distributed-sagas/saga.test.ts
```

Inspecione os arquivos em [`lab/06-distributed-sagas/`](file:///Users/andersonalves/dev/arch-lab/lab/06-distributed-sagas).

### 4. Observe
Veja os logs da Máquina de Estados: `ORDER_CREATED` → `INVENTORY_RESERVED` → `PAYMENT_FAILED` → `COMPENSATING_INVENTORY` → `SAGA_COMPENSATED_FAILED`.
Verifique que a quantidade de itens no estoque voltou exatamente ao valor original.

### 5. Reflexão & Gabarito
<details>
<summary>Ver explicação e gabarito</summary>

**Consistência Sem Bloqueios:**
- A Saga troca o isolamento rígido do 2PC por consistência eventual com compensação semântica explícita.
- Cada serviço executa transações locais rápidas, permitindo que o sistema escale horizontalmente sem deadlocks distribuídos.

</details>
