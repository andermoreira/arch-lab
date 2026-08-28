# Workbook 05: EDA & Transactional Outbox Pattern

## 🎯 Pergunta Condutora do Módulo
*Por que fazer commit no banco relacional e em seguida chamar o broker de mensageria (Dual-Write) gera perda silenciosa de eventos na nuvem, e como o Transactional Outbox com Idempotent Consumer garante consistência absoluta?*

---

## 🧪 Exercício 1: O Fenômeno da Falha Silenciosa no Dual-Write

### 1. Objetivo
Simular a clássica falha de rede que ocorre entre o commit do banco de dados e a chamada ao broker de mensageria (RabbitMQ/Kafka), demonstrando a corrupção do estado distribuído.

### 2. Hipótese
Analise o fluxo ingênuo de código:
```typescript
await db.query("INSERT INTO orders (...)"); // Sucesso no Postgres
await broker.publish("order.created", payload); // TIMEOUT DE REDE OU CRASH DA APLICAÇÃO!
```
Formule sua previsão:
- ( ) O PostgreSQL fará rollback automático da ordem quando o broker falhar.
- ( ) O pedido permanecerá gravado no PostgreSQL, mas a mensagem NUNCA chegará ao broker. O cliente pagou, mas o setor de estoque e entrega nunca saberão que o pedido existiu!

### 3. Faça
Execute o teste do Transactional Outbox:
```bash
npx vitest run lab/05-eda-and-outbox/outbox.test.ts
```

Inspecione os arquivos em [`lab/05-eda-and-outbox/`](file:///Users/andersonalves/dev/arch-lab/lab/05-eda-and-outbox).

### 4. Observe
Veja que no laboratório:
- A abordagem ingênua perde o evento sob falha de rede.
- A abordagem com **Transactional Outbox** grava o pedido e a mensagem na tabela `outbox_messages` dentro da MESMA transação ACID local. Se o broker falhar, o `OutboxRelay` retenta automaticamente até que a mensagem seja confirmada.

### 5. Reflexão & Gabarito
<details>
<summary>🔍 Diagnóstico Arquitetural Profundo & Mecânica Interna</summary>

**A Falácia do Dual-Write:**
Não existe transação distribuída atômica automática entre um banco SQL e um Message Broker. Se você executar duas chamadas de rede sequenciais, uma delas SEMPRE poderá falhar.
O **Transactional Outbox Pattern** resolve isso transformando a comunicação em duas etapas:
1. **Etapa Atômica Local:** Salva o dado de negócio e a mensagem no banco relacional na mesma transação ACID.
2. **Etapa de Relay Assíncrono:** Um processo independente (Polling ou Change Data Capture via Debezium) lê a tabela Outbox e publica no broker com confirmação (*Ack*).
</details>

---

## 🧪 Exercício 2: Deduplicação com Idempotent Consumer

### 1. Objetivo
Simular a retransmissão de mensagens provocada por retries de rede e verificar como o consumidor descarta cópias duplicadas sem reprocessar regras de negócio.

### 2. Hipótese
Se o relay enviar a mesma mensagem 3 vezes devido a timeouts de confirmação:
- ( ) O saldo do cliente será debitado 3 vezes.
- ( ) O `IdempotentConsumer` processará a mensagem apenas na primeira vez, gravando o `message_id` na tabela de mensagens processadas e ignorando com segurança as 2 tentativas subsequentes.

### 3. Faça
Inspecione o consumidor em [`lab/05-eda-and-outbox/idempotent-consumer.ts`](file:///Users/andersonalves/dev/arch-lab/lab/05-eda-and-outbox/idempotent-consumer.ts).

### 4. Observe
O teste confirma que o estado de negócio é mutado exatamente uma única vez, provando a semântica de *Effectively-Once Processing*.

### 5. Reflexão & Gabarito
<details>
<summary>🔍 Diagnóstico Arquitetural Profundo & Mecânica Interna</summary>

**Entrega At-Least-Once + Consumidor Idempotente = Consistência:**
Em redes distribuídas, nenhum broker pode garantir entrega exatamente uma vez (*Exactly-Once*) em todos os cenários de falha sem custos proibitivos. O padrão padrão ouro da indústria é combinar **At-Least-Once Delivery** (via Outbox) com **Idempotent Consumers** no destino.
</details>
