# Guia de Referência 00: O Papel do Arquiteto, Trade-offs & Modelagem C4

## 1. O Papel do Arquiteto de Software Moderno
O arquiteto moderno não é um emissor de ordens em torre de marfim ("Ivory Tower Architect"). Ele atua como um facilitador técnico e estrategista de longo prazo:
- **Alinhamento com o Negócio:** Garantir que as decisões técnicas viabilizem a estratégia da empresa.
- **Gerenciamento de Trade-offs:** Balancear atributos de qualidade conflitantes (ex: consistência forte vs latência ultra-baixa).
- **Governança Automatizada:** Estabelecer Fitness Functions para que as diretrizes sejam respeitadas pelo CI.

---

## 2. Modelagem com o Modelo C4 (Simon Brown)

O modelo C4 organiza a arquitetura em 4 níveis de abstração hierárquica:

```mermaid
graph TD
    subgraph Level_1 [Nível 1: Diagrama de Contexto]
        User[Usuário Final] -->|Consome| Sys[Sistema de E-Commerce]
        Sys -->|Processa Pagamento| ExtPay[Gateway de Pagamento Externo]
        Sys -->|Envia Notificação| ExtMail[Serviço de E-mail SES]
    end
```

```mermaid
graph TD
    subgraph Level_2 [Nível 2: Diagrama de Contêineres]
        SPA[Single Page App - React] -->|HTTPS / JSON| API[API Gateway / NestJS / Fastify]
        API -->|TCP / SQL| DB[(PostgreSQL 16)]
        API -->|TCP / Cache| REDIS[(Redis 7 Cluster)]
        API -->|AMQP / Eventos| KAFKA[(Apache Kafka / RabbitMQ)]
    end
```

```mermaid
graph TD
    subgraph Level_3 [Nível 3: Diagrama de Componentes]
        CTRL[OrderController] -->|Aciona| UC[CreateOrderUseCase]
        UC -->|Manipula| DOM[Order Aggregate Root]
        UC -->|Persiste via Porta| REPO[OrderRepositoryPort]
        UC -->|Notifica via Porta| OUTBOX[OutboxPublisherPort]
    end
```

---

## 3. Fitness Functions na Prática
Uma Fitness Function é um teste automatizado que mede a integridade de um atributo arquitetural:

```typescript
// Exemplo conceitual de Fitness Function
test('domain layer must not depend on database drivers', () => {
  const violations = scanImports({
    targetDir: 'src/domain',
    forbiddenPackages: ['pg', 'typeorm', 'mongoose', 'express', 'axios'],
  });
  expect(violations).toHaveLength(0);
});
```
