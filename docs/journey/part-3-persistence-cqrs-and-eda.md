# Jornada — Parte 3: Persistência Avançada, CQRS, Event Sourcing & EDA

## 🎯 Pergunta Condutora
> *"Como escalar leituras e escritas de alta volumetria sem gerar gargalos de locks relacionais, e como garantir mensageria assíncrona à prova de falhas eliminando o desastre do Dual-Write?"*

---

## 1. Fase 4: Padrões de Persistência, CQRS & Event Sourcing

### O Dilema do Modelo Único de Dados
Em sistemas tradicionais, a mesma tabela relacional atende:
1. **Escritas transacionais:** Que exigem normalização estrita (3FN), chaves estrangeiras e locks atômicos para garantir invariantes.
2. **Leituras analíticas e dashboards:** Que exigem agregações massivas, joins complexos e desnormalização para baixa latência.

O resultado é contenção de locks: relatórios pesados travam operações de escrita de checkout.

### CQRS (Command Query Responsibility Segregation)
O CQRS separa esses caminhos:
- **Command Model:** Otimizado exclusivamente para validação de regras de negócio e mutação consistente.
- **Query Model (Projections):** Tabelas ou documentos desnormalizados otimizados para leitura instantânea por chave primária, atualizados de forma assíncrona.

```mermaid
graph TD
    User([Usuário / Client]) -->|POST /orders Command| CH[Command Handler]
    CH -->|Valida e Persiste| WriteDB[(Write Store / Event Store)]
    WriteDB -->|Publica Evento| Proj[Projection Worker]
    Proj -->|Atualiza Visão Desnormalizada| ReadDB[(Read Store / Cache)]
    User -->|GET /orders/123 Query| QH[Query Handler]
    QH -->|Leitura Otimizada| ReadDB
```

### Event Sourcing: O Log Imutável
Em vez de sobrescrever o saldo com `UPDATE accounts SET balance = 100`, persistimos a sequência histórica de fatos imutáveis:
1. `AccountCreated(id=1, initial=0)`
2. `MoneyDeposited(id=1, amount=150)`
3. `MoneyWithdrawn(id=1, amount=50)`

O saldo atual ($100$) é reconstruído via **Event Replay**. Para otimizar performance com milhares de eventos, geramos **Snapshots** periódicos.
A concorrência é tratada via **Optimistic Concurrency** verificando o número de versão do stream (`expectedVersion`).

---

## 2. Fase 5: Arquiteturas Orientadas a Eventos (EDA) & Mensageria Resiliente

### A Armadilha Fatal do Dual-Write
Considere o código comum:
```typescript
await db.query("INSERT INTO orders VALUES (...)"); // 1. Commit no Banco
await messageBroker.publish("order-created", payload); // 2. Publica no Kafka/RabbitMQ
```
**O que acontece se o servidor cair ou a rede falhar exatamente entre a linha 1 e 2?**
O pedido existe no banco, mas os sistemas de pagamento e envio nunca serão notificados. O cliente é cobrado ou o produto nunca é enviado.

### A Solução: Transactional Outbox Pattern
Salvamos a intenção de mensagem dentro da **mesma transação ACID** do banco relacional:

```mermaid
sequenceDiagram
    participant App as Aplicação
    participant DB as PostgreSQL (ACID)
    participant Relay as Outbox Relay (Worker)
    participant Broker as Message Broker (Kafka/Redis)
    participant Consumer as Idempotent Consumer

    App->>DB: BEGIN TRANSACTION
    App->>DB: INSERT INTO orders VALUES (...)
    App->>DB: INSERT INTO outbox (topic, payload, status='PENDING')
    App->>DB: COMMIT TRANSACTION
    
    loop A cada 50ms ou via CDC
        Relay->>DB: SELECT * FROM outbox WHERE status = 'PENDING' FOR UPDATE SKIP LOCKED
        Relay->>Broker: Publish Message
        Relay->>DB: UPDATE outbox SET status = 'PUBLISHED' WHERE id = message.id
    end

    Broker->>Consumer: Deliver Message (At-Least-Once)
    Consumer->>Consumer: Check processed_messages table
    alt Se já processado
        Consumer-->>Broker: ACK (Skip processing)
    else Se novo
        Consumer->>Consumer: Execute Business Action
        Consumer->>Consumer: INSERT INTO processed_messages
        Consumer-->>Broker: ACK
    end
```

---

## 🔬 Checkpoint Prático da Parte 3

Execute o laboratório e complete os workbooks:
- Workbook: [`docs/workbooks/04-cqrs-event-sourcing-workbook.md`](file:///Users/andersonalves/dev/arch-lab/docs/workbooks/04-cqrs-event-sourcing-workbook.md)
- Lab: [`lab/04-cqrs-event-sourcing/`](file:///Users/andersonalves/dev/arch-lab/lab/04-cqrs-event-sourcing)
- Workbook: [`docs/workbooks/05-eda-outbox-workbook.md`](file:///Users/andersonalves/dev/arch-lab/docs/workbooks/05-eda-outbox-workbook.md)
- Lab: [`lab/05-eda-and-outbox/`](file:///Users/andersonalves/dev/arch-lab/lab/05-eda-and-outbox)
