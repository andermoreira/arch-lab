# Guia de Referência 04: CQRS & Event Sourcing Deep Dive

## 1. CQRS (Command Query Responsibility Segregation)

Criado por Greg Young com base no princípio CQS de Bertrand Meyer, o CQRS preconiza que qualquer operação sobre um sistema é ou uma **Mutação (Command)** ou uma **Consulta (Query)**, nunca ambos:

```text
               +--------------------------------------------+
               |                  CLIENT                    |
               +----------------------+---------------------+
                                      |
                +---------------------+---------------------+
                |                                           |
     [COMMAND: POST /pay]                         [QUERY: GET /balance]
                |                                           |
                v                                           v
     +---------------------+                     +---------------------+
     |   Command Handler   |                     |    Query Handler    |
     +----------+----------+                     +----------+----------+
                |                                           |
                v                                           v
     +---------------------+                     +---------------------+
     | Domain Model / Write|                     | Read Model / Proj.  |
     | (Enforces Invariant)|                     | (Fast, Denormalized)|
     +----------+----------+                     +----------+----------+
                |                                           ^
                |        Async Event Stream                 |
                +-------------------------------------------+
```

---

## 2. Event Sourcing

### 2.1 A Estrutura do Append-Only Event Store
No Event Sourcing, cada mutação gera um evento imutável indexado por um stream de agregado:

| stream_id | version | event_type | payload | timestamp |
|---|---|---|---|---|
| `acc-101` | 1 | `AccountOpened` | `{"holder": "Alice", "currency": "BRL"}` | `2026-08-27T10:00:00Z` |
| `acc-101` | 2 | `MoneyDeposited` | `{"amount": 500, "currency": "BRL"}` | `2026-08-27T10:05:00Z` |
| `acc-101` | 3 | `MoneyWithdrawn` | `{"amount": 200, "currency": "BRL"}` | `2026-08-27T10:15:00Z` |

### 2.2 Replay e Snapshots
- **Replay:** O estado atual do agregado é obtido instanciando um objeto vazio e aplicando sequencialmente cada evento do stream histórico.
- **Snapshots:** Para agregados com centenas de eventos, gravamos um snapshot do estado na versão $V$ (ex: $V=100$), e carregamos apenas os eventos com versão $> 100$.

### 2.3 Concorrência Otimista (`expectedVersion`)
Para evitar conflito de gravação concorrente:
```typescript
async appendEvents(streamId: string, events: DomainEvent[], expectedVersion: number): Promise<void> {
  const currentVersion = await this.getCurrentVersion(streamId);
  if (currentVersion !== expectedVersion) {
    throw new ConcurrencyConflictError(
      `Stream ${streamId} version mismatch. Expected ${expectedVersion}, found ${currentVersion}`
    );
  }
  // Insere atomicamente
}
```
