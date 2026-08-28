import { describe, it, expect } from 'vitest';
import { BankAccountAggregate } from './domain/bank-account.aggregate.js';
import { InMemoryEventStore, ConcurrencyConflictError } from './store/event-store.js';
import { AccountBalanceProjection } from './projections/account-balance.projection.js';

describe('Fase 4: CQRS & Event Sourcing (Append-Only Event Store & Projections)', () => {
  it('should create account, record deposits/withdrawals and maintain projection', async () => {
    const eventStore = new InMemoryEventStore();
    const projection = new AccountBalanceProjection();
    eventStore.subscribe((e) => projection.handle(e));

    const accountId = 'acc_alice_01';

    // 1. Command: Open Account
    const account = BankAccountAggregate.open(accountId, 'Alice', 100);
    await eventStore.append(accountId, account.uncommittedEvents, 0);
    account.clearUncommittedEvents();

    // 2. Command: Deposit
    account.deposit(250, 'Salary payment');
    await eventStore.append(accountId, account.uncommittedEvents, 1);
    account.clearUncommittedEvents();

    // 3. Command: Withdraw
    account.withdraw(50, 'ATM cash');
    await eventStore.append(accountId, account.uncommittedEvents, 2);
    account.clearUncommittedEvents();

    expect(account.balance).toBe(300);
    expect(account.version).toBe(3);

    // 4. Query side verification
    const summary = projection.getById(accountId);
    expect(summary).not.toBeNull();
    expect(summary?.currentBalance).toBe(300);
    expect(summary?.totalTransactions).toBe(2);
    expect(summary?.holder).toBe('Alice');
  });

  it('should replay historical events to reconstruct exact aggregate state', async () => {
    const eventStore = new InMemoryEventStore();
    const accountId = 'acc_bob_02';

    const account = BankAccountAggregate.open(accountId, 'Bob', 500);
    account.deposit(100);
    account.withdraw(200);
    await eventStore.append(accountId, account.uncommittedEvents, 0);

    // Fetch raw event history
    const history = await eventStore.getEventsForStream(accountId);
    expect(history).toHaveLength(3);

    // Replay state from events
    const rehydrated = BankAccountAggregate.replayFromHistory(history);
    expect(rehydrated.id).toBe(accountId);
    expect(rehydrated.holder).toBe('Bob');
    expect(rehydrated.balance).toBe(400);
    expect(rehydrated.version).toBe(3);
  });

  it('should rebuild a read-model projection from scratch by replaying the event store (the signature ES capability)', async () => {
    const eventStore = new InMemoryEventStore();

    // Projeção "viva": atualizada em tempo real via subscribe conforme os
    // comandos são aplicados (o caminho normal de CQRS).
    const liveProjection = new AccountBalanceProjection();
    eventStore.subscribe((e) => liveProjection.handle(e));

    const accountId = 'acc_dave_04';
    const account = BankAccountAggregate.open(accountId, 'Dave', 1000);
    await eventStore.append(accountId, account.uncommittedEvents, 0);
    account.clearUncommittedEvents();

    account.deposit(500, 'Bonus');
    await eventStore.append(accountId, account.uncommittedEvents, 1);
    account.clearUncommittedEvents();

    account.withdraw(300, 'Rent');
    await eventStore.append(accountId, account.uncommittedEvents, 2);
    account.clearUncommittedEvents();

    // --- REBUILD ---
    // Uma projeção NOVA, que nunca foi assinada e portanto perdeu todos os
    // eventos em tempo real, é reconstruída do zero relendo o event store a
    // partir do evento 0. Isso simula recriar um read model (ex.: nova versão do
    // schema de leitura, ou recuperação após corrupção do read store).
    const rebuiltProjection = new AccountBalanceProjection();
    const history = await eventStore.getEventsForStream(accountId);
    for (const event of history) {
      rebuiltProjection.handle(event);
    }

    // A projeção reconstruída por replay puro é idêntica à viva.
    const live = liveProjection.getById(accountId)!;
    const rebuilt = rebuiltProjection.getById(accountId)!;

    expect(rebuilt.currentBalance).toBe(live.currentBalance);
    expect(rebuilt.currentBalance).toBe(1200);
    expect(rebuilt.totalTransactions).toBe(live.totalTransactions);
    expect(rebuilt.totalTransactions).toBe(2);
    expect(rebuilt.holder).toBe('Dave');
  });

  it('should detect optimistic concurrency conflict on version mismatch', async () => {
    const eventStore = new InMemoryEventStore();
    const accountId = 'acc_carol_03';

    const account = BankAccountAggregate.open(accountId, 'Carol', 1000);
    await eventStore.append(accountId, account.uncommittedEvents, 0);

    // Two concurrent clients load version 1
    const clientA = BankAccountAggregate.replayFromHistory(await eventStore.getEventsForStream(accountId));
    const clientB = BankAccountAggregate.replayFromHistory(await eventStore.getEventsForStream(accountId));

    // Client A commits version 2 first
    clientA.withdraw(100);
    await eventStore.append(accountId, clientA.uncommittedEvents, 1);

    // Client B attempts to commit version 2 with stale expectedVersion 1
    clientB.withdraw(200);
    await expect(
      eventStore.append(accountId, clientB.uncommittedEvents, 1)
    ).rejects.toThrow(ConcurrencyConflictError);
  });
});
