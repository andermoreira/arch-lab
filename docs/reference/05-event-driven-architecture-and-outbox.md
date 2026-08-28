# Guia de Referência 05: EDA, Transactional Outbox & Teoremas Distribuídos

## 1. Classificação de Mensagens em EDA (Martin Fowler)

1. **Event Notification:** Mensagem enxuta que apenas sinaliza um fato (`{"eventType": "OrderCreated", "id": "123"}`). O consumidor precisa buscar detalhes via HTTP síncrono.
2. **Event-Carried State Transfer (ECST):** Mensagem rica que transporta todo o estado necessário. Elimina chamadas de volta, aumentando a resiliência e desacoplamento.
3. **Event Collaboration:** Padrão onde múltiplos serviços cooperam distribuindo a lógica de negócio por meio de eventos encadeados.

---

## 2. O Padrão Transactional Outbox

O problema clássico do **Dual-Write** ocorre quando uma aplicação tenta gravar no banco e publicar na mensageria em duas chamadas de rede sequenciais. Uma falha entre as chamadas gera corrupção de estado distribuído.

```mermaid
graph TD
    subgraph Single_ACID_Transaction [Transação Local Atômica PostgreSQL]
        A[1. INSERT INTO orders ...]
        B[2. INSERT INTO outbox_messages ...]
    end

    subgraph Outbox_Relay [Processo Outbox Relay / Debezium CDC]
        C[3. Lê mensagens PENDING]
        D[4. Publica no Message Broker]
        E[5. Atualiza status para PUBLISHED]
    end

    subgraph Idempotent_Consumer [Consumidor Idempotente]
        F[6. Recebe Mensagem message_id]
        G{message_id já processado?}
        H[7. Executa Lógica de Negócio]
        I[8. Grava message_id em processed_events]
        J[Descarta Duplicata]
    end

    A --> B
    B --> C
    C --> D
    D --> E
    D --> F
    F --> G
    G -->|Não| H
    H --> I
    G -->|Sim| J
```

---

## 3. Teoremas Fundamentais de Sistemas Distribuídos

### Teorema CAP (Eric Brewer)
Em qualquer sistema distribuído com dados particionados pela rede ($P$), você só pode garantir simultaneamente dois dos três atributos:
- **CP (Consistency + Partition Tolerance):** Prefere consistência absoluta a qualquer custo. Rejeita requisições se houver partição de rede (ex: etcd, Raft, PostgreSQL síncrono).
- **AP (Availability + Partition Tolerance):** Prefere responder sempre com baixa latência, aceitando consistência eventual e leituras potencialmente desatualizadas (ex: Cassandra, DynamoDB).

### Teorema PACELC (Daniel Abadi)
Complementa o CAP detalhando o comportamento do sistema em tempos de normalidade sem falhas de rede:
> **P**artição $\to$ Escolha entre Disponibilidade (**A**) ou Consistência (**C**);  
> **E**lse (em operação normal) $\to$ Escolha entre Latência (**L**) ou Consistência (**C**).
