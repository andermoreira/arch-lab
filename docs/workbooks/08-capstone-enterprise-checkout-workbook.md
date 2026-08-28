# Workbook 08: Capstone Sênior: Arquitetura Corporativa de Checkout

## 🎯 Pergunta Condutora do Módulo
*Como unificar Múltiplos Bounded Contexts, Arquitetura Hexagonal, Sagas Orquestradas com Compensação, Transactional Outbox e Fitness Functions em uma arquitetura corporativa completa pronta para produção?*

---

## 🧪 Exercício 1: O Fluxo Feliz do Checkout Corporativo de Ponta a Ponta

### 1. Objetivo
Executar o fluxo completo de checkout integrando os Bounded Contexts `OrderContext`, `InventoryContext` e `PaymentContext` com confirmação atômica de Outbox e orquestração de Saga.

### 2. Hipótese
Formule sua previsão:
- ( ) O pedido será criado, o estoque decrementado, o pagamento aprovado no gateway e o evento de domínio gravado na tabela Outbox para processamento assíncrono.
- ( ) Ocorrerá conflito de dependência entre os contextos.

### 3. Faça
Execute o teste do Capstone Corporativo:
```bash
npx vitest run lab/08-capstone-enterprise-checkout/capstone.test.ts
```

Inspecione a arquitetura em [`lab/08-capstone-enterprise-checkout/`](file:///Users/andersonalves/dev/arch-lab/lab/08-capstone-enterprise-checkout).

### 4. Observe
Veja que todos os passos são concluídos com sucesso e os eventos gravados na Outbox corporativa estão prontos para envio aos sistemas de Logística e BI.

### 5. Reflexão & Gabarito
<details>
<summary>🔍 Diagnóstico Arquitetural Profundo & Mecânica Interna</summary>

**A Síntese Arquitetural:**
1. Cada Bounded Context possui seu próprio Aggregate Root encapsulando invariantes de negócio.
2. Cada serviço expõe apenas Portas Limpas, sem acoplamento a drivers de banco ou HTTP.
3. O Orquestrador de Saga garante que a transação distribuída seja gerenciada com segurança de tipos e compensação automática.
</details>

---

## 🧪 Exercício 2: Resiliência Total em Cenário de Falha de Saldo

### 1. Objetivo
Executar o checkout simulando falha de pagamento e observar a compensação automática completa, validando que nenhum item de estoque permanece travado e o pedido é cancelado de forma limpa.

### 2. Faça
Execute o teste específico de falha com compensação no Capstone:
```bash
npx vitest run -t "compensates" lab/08-capstone-enterprise-checkout/capstone.test.ts
```

### 3. Observe
O estoque é revertido imediatamente ao estado inicial e o status do pedido transiciona para `CANCELLED`.

### 4. Reflexão & Gabarito
<details>
<summary>🔍 Diagnóstico Arquitetural Profundo & Mecânica Interna</summary>

**Excelência em Engenharia de Software:**
Um sistema corporativo de nível Staff/Principal Engineer não se destaca apenas quando tudo funciona no "caminho feliz", mas sim pela elegância, determinismo e confiabilidade com que lida com falhas parciais de rede e inconsistências distribuídas.
</details>
