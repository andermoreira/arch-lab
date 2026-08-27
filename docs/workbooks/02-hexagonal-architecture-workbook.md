# Workbook 02: Arquitetura Hexagonal (Ports & Adapters)

## 🎯 Pergunta do Módulo
Como desacoplar totalmente um caso de uso de checkout do provedor de pagamento (Stripe) e do banco de dados (PostgreSQL), permitindo rodar testes em milissegundos com adaptadores em memória?

---

## 🧪 Exercício 1: Substituição de Adaptadores sem Alterar o Core

### 1. Objetivo
Executar o mesmo caso de uso de negócio (`CreateOrderUseCase`) com o adaptador de persistência `InMemoryOrderRepository` e depois com `PostgresOrderRepository`.

### 2. Hipótese
Formule sua previsão:
- *O core de negócio precisa sofrer alguma alteração ou import quando substituímos o banco de dados por uma estrutura em memória?*

### 3. Faça
Execute a suíte de testes da Arquitetura Hexagonal:
```bash
npx vitest run lab/02-hexagonal-architecture/hexagonal.test.ts
```

Inspecione os arquivos em [`lab/02-hexagonal-architecture/`](file:///Users/andersonalves/dev/arch-lab/lab/02-hexagonal-architecture).

### 4. Observe
Note que a suite roda instantaneamente usando `InMemoryOrderRepository` e passa em 100% dos testes sem precisar conectar a nenhuma infraestrutura externa.

### 5. Reflexão & Gabarito
<details>
<summary>Ver explicação e gabarito</summary>

**Análise Arquitetural:**
- O caso de uso depende exclusivamente da porta `OrderRepositoryPort` (uma interface TypeScript pura).
- Essa inversão permite testabilidade instantânea, redução de custos de CI e total liberdade para modernizar a infraestrutura no futuro.

</details>
