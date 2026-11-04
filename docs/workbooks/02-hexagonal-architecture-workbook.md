# Workbook 02: Arquitetura Hexagonal & Clean Architecture

## 🎯 Pergunta Condutora do Módulo
*Como estruturar uma aplicação para que trocar o PostgreSQL pelo DynamoDB ou trocar o Express pelo Fastify/CLI não exija a alteração de uma única linha sequer das regras de negócio do Domínio?*

---

## 🧪 Exercício 1: O Fenômeno do Acoplamento Database-Driven

### 1. Objetivo
Observar o colapso de uma aplicação tradicional N-Tier (onde a entidade de negócio é uma classe TypeORM/Prisma com anotações de tabela) quando o banco precisa ser substituído por persistência em memória para testes ultra-rápidos.

### 2. Hipótese
Formule sua previsão:
- ( ) Em uma arquitetura N-Tier tradicional acoplada ao banco, é possível testar as regras de negócio em 2 milissegundos sem subir o Docker com PostgreSQL.
- ( ) Em uma arquitetura N-Tier tradicional, as regras de negócio falham ao serem executadas sem o banco de dados porque o modelo depende dos tipos e métodos do ORM. Na Arquitetura Hexagonal, o Core depende apenas de Portas (interfaces) e roda 100% isolado.

### 3. Faça
Execute os testes do laboratório de Arquitetura Hexagonal:
```bash
npx vitest run lab/02-hexagonal-architecture/hexagonal.test.ts
```

Inspecione a estrutura de pastas em [`lab/02-hexagonal-architecture/`](../../lab/02-hexagonal-architecture).

### 4. Observe
Veja que o mesmo caso de uso (`CreateOrderUseCase`) é executado contra o adaptador em memória (`InMemoryOrderRepository`) e mock de gateway de pagamento, executando em menos de 5ms com isolamento absoluto.

### 5. Reflexão & Gabarito
<details>
<summary>🔍 Diagnóstico Arquitetural Profundo & Mecânica Interna</summary>

**A Mecânica de Portas & Adaptadores (Alistair Cockburn):**
- **Porta Primária (Driving/Inbound):** `CreateOrderUseCase` define a interface de entrada que a aplicação oferece ao mundo externo (ex: HTTP Controller ou CLI).
- **Portas Secundárias (Driven/Outbound):** `OrderRepositoryPort`, `PaymentGatewayPort` e `NotificationPort` definem os contratos que o Core exige do mundo externo.
- **Adaptadores:** Implementam ou consomem as portas sem que o Domínio saiba de sua existência. O Domínio vive dentro do hexágono; banco, web, filas e provedores terceiros vivem fora.
</details>

---

## 🧪 Exercício 2: Plugar Múltiplos Adaptadores Sem Tocar no Core

### 1. Objetivo
Injetar adaptadores alternativos (ex: envio de notificação por SMS vs E-mail vs Console Mock) em tempo de execução via Injeção de Dependências.

### 2. Hipótese
Se trocarmos o `MockPaymentGatewayAdapter` por um `StripePaymentGatewayAdapter`:
- ( ) O arquivo `domain/order.ts` precisará ser modificado para receber os tokens do Stripe.
- ( ) O arquivo `domain/order.ts` e o `application/create-order.service.ts` permanecerão 100% inalterados, pois ambos dependem apenas do contrato `PaymentGatewayPort`.

### 3. Faça
Inspecione o serviço de aplicação em [`lab/02-hexagonal-architecture/application/create-order.service.ts`](../../lab/02-hexagonal-architecture/application/create-order.service.ts).

### 4. Observe
O construtor do serviço recebe apenas as interfaces de porta:
```typescript
constructor(
  private readonly orderRepo: OrderRepositoryPort,
  private readonly paymentGateway: PaymentGatewayPort,
  private readonly notifier: NotificationPort
) {}
```

### 5. Reflexão & Gabarito
<details>
<summary>🔍 Diagnóstico Arquitetural Profundo & Mecânica Interna</summary>

**A Regra de Dependência Estrita (Clean Architecture):**
O código fonte só pode apontar **para dentro**, em direção aos casos de uso e entidades. Nada na camada interna pode saber nada sobre a camada externa.
Isso garante independência de frameworks, testabilidade pura e independência de UI e banco de dados.
</details>

---

## ✅ Critério de pronto

Você domina este módulo quando `npx vitest run lab/02-hexagonal-architecture/hexagonal.test.ts` passa, `npm run lint` valida sem erros e você explica, sem reabrir o gabarito, em que ponto a sua hipótese divergiu do observado em cada exercício.
