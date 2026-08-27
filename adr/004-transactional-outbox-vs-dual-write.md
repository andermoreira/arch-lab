# ADR 004: Eliminação de Dual-Write com o Padrão Transactional Outbox

## Status
Accepted

## Data
2026-08-27

## Contexto
Em arquiteturas orientadas a eventos (EDA), microsserviços frequentemente precisam salvar dados no banco relacional e publicar uma mensagem no broker (RabbitMQ, Kafka, Redis).
A execução ingênua de duas chamadas de rede sequenciais (*Dual-Write*):
1. `db.commit()`
2. `broker.publish()`

Gera inconsistência crítica caso o processo sofra crash ou timeout de rede entre o passo 1 e o passo 2. O dado é persistido, mas os consumidores nunca recebem a mensagem. Inverter a ordem gera dados fantasmas no broker caso o commit do banco falhe.

## Decisão
Adotamos o **Transactional Outbox Pattern** com **Idempotent Consumer**:
1. O evento de domínio é inserido em uma tabela `outbox_messages` dentro da mesma transação SQL local da entidade.
2. Um processo dedicado (*Outbox Relay / Poller*) lê as mensagens não publicadas e as envia ao broker com retries.
3. Os consumidores utilizam o padrão **Idempotent Consumer**, mantendo um registro de `processed_messages` para descartar duplicidades resultantes de entregas *at-least-once*.

## Consequências

### Positivas
- Garantia matemática de que nenhum evento comitado no banco será perdido (*At-Least-Once Delivery*).
- Eliminação da necessidade de transações distribuídas 2PC / XA sobre o broker de mensagens.

### Negativas / Mitigações
- Consistência eventual: existe uma latência milimétrica entre o commit do banco e a publicação pelo Relay.
- Consumidores devem ser obrigatoriamente idempotentes.
