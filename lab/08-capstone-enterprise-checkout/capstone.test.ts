import { describe, it, expect } from 'vitest';
import { InMemoryOrderRepository } from './orders/adapters/in-memory-order.repository.js';
import { StockAggregate } from './inventory/domain/stock.aggregate.js';
import { InMemoryInventoryRepository } from './inventory/adapters/in-memory-inventory.repository.js';
import { MockEnterprisePaymentAdapter } from './payments/adapters/mock-payment-gateway.adapter.js';
import { EnterpriseOutbox } from './outbox/enterprise-outbox.js';
import { EnterpriseOutboxRelay, MockEnterpriseEventBroker } from './outbox/enterprise-outbox-relay.js';
import { CheckoutSagaOrchestrator } from './saga/checkout-saga.orchestrator.js';

describe('Fase 8: Senior Capstone — Enterprise E-Commerce Checkout Architecture', () => {
  it('should complete end-to-end checkout with inventory reservation, payment and outbox logging', async () => {
    const orderRepo = new InMemoryOrderRepository();
    const inventoryRepo = new InMemoryInventoryRepository();
    const paymentAdapter = new MockEnterprisePaymentAdapter();
    const outbox = new EnterpriseOutbox();

    // Seed stock
    await inventoryRepo.save(new StockAggregate('GPU-RTX-5090', 10));

    const saga = new CheckoutSagaOrchestrator(orderRepo, inventoryRepo, paymentAdapter, outbox);

    const result = await saga.execute({
      orderId: 'ord_capstone_001',
      customerId: 'cust_enterprise_88',
      sku: 'GPU-RTX-5090',
      quantity: 2,
      unitPrice: 1999,
      creditCardToken: 'valid_corp_card',
    });

    expect(result.status).toBe('CONFIRMED');
    expect(result.totalAmount).toBe(3998);
    expect(result.compensated).toBe(false);

    // Verify Order persistence
    const savedOrder = await orderRepo.findById('ord_capstone_001');
    expect(savedOrder?.status).toBe('CONFIRMED');

    // Verify Inventory deduction
    const updatedStock = await inventoryRepo.findBySku('GPU-RTX-5090');
    expect(updatedStock?.availableQuantity).toBe(8);

    // Verify Outbox audit trail
    expect(outbox.records.map((r) => r.eventName)).toEqual([
      'OrderDraftCreated',
      'InventoryReserved',
      'PaymentAuthorized',
      'OrderConfirmed',
    ]);
  });

  it('should automatically compensate inventory and cancel order on credit card decline', async () => {
    const orderRepo = new InMemoryOrderRepository();
    const inventoryRepo = new InMemoryInventoryRepository();
    const paymentAdapter = new MockEnterprisePaymentAdapter();
    const outbox = new EnterpriseOutbox();

    // Seed stock
    await inventoryRepo.save(new StockAggregate('SERVER-RACK-42U', 3));

    const saga = new CheckoutSagaOrchestrator(orderRepo, inventoryRepo, paymentAdapter, outbox);

    const result = await saga.execute({
      orderId: 'ord_capstone_002',
      customerId: 'cust_corp_99',
      sku: 'SERVER-RACK-42U',
      quantity: 1,
      unitPrice: 3500,
      creditCardToken: 'card_DECLINE_insufficient_credit',
    });

    expect(result.status).toBe('REJECTED');
    expect(result.failureReason).toContain('Credit card declined');
    expect(result.compensated).toBe(true);

    // Verify order cancelled
    const savedOrder = await orderRepo.findById('ord_capstone_002');
    expect(savedOrder?.status).toBe('CANCELLED');

    // Verify inventory restored by compensation
    const stock = await inventoryRepo.findBySku('SERVER-RACK-42U');
    expect(stock?.availableQuantity).toBe(3); // Untouched!

    // Verify compensation event in Outbox
    expect(outbox.records.map((r) => r.eventName)).toContain('InventoryCompensationReleased');
    expect(outbox.records.map((r) => r.eventName)).toContain('OrderCancelled');
  });

  it('should refund the authorized payment when a post-payment step fails (compensation of the payment context)', async () => {
    const inventoryRepo = new InMemoryInventoryRepository();
    const paymentAdapter = new MockEnterprisePaymentAdapter();
    const outbox = new EnterpriseOutbox();

    await inventoryRepo.save(new StockAggregate('CAMERA-A7', 5));

    // Repositório de pedidos que falha ao salvar o pedido CONFIRMADO (2ª save),
    // simulando uma falha DEPOIS que o pagamento já foi autorizado. É o único
    // caminho que exercita a compensação de refund + o estado REFUNDED.
    const faultyOrderRepo = new InMemoryOrderRepository();
    const originalSave = faultyOrderRepo.save.bind(faultyOrderRepo);
    let saveCalls = 0;
    faultyOrderRepo.save = async (order) => {
      saveCalls += 1;
      if (saveCalls === 2) {
        throw new Error('Order store unavailable during confirm');
      }
      return originalSave(order);
    };

    const saga = new CheckoutSagaOrchestrator(faultyOrderRepo, inventoryRepo, paymentAdapter, outbox);

    const result = await saga.execute({
      orderId: 'ord_capstone_004',
      customerId: 'cust_corp_77',
      sku: 'CAMERA-A7',
      quantity: 1,
      unitPrice: 2500,
      creditCardToken: 'valid_card',
    });

    expect(result.status).toBe('REJECTED');
    expect(result.compensated).toBe(true);

    // O pagamento foi autorizado e depois estornado pela compensação.
    expect(paymentAdapter.refundedTransactions).toHaveLength(1);
    const eventNames = outbox.records.map((r) => r.eventName);
    expect(eventNames).toContain('PaymentAuthorized');
    expect(eventNames).toContain('PaymentRefunded');
    expect(eventNames).toContain('InventoryCompensationReleased');

    // O agregado de pagamento terminou em REFUNDED no evento de compensação.
    const refundEvent = outbox.records.find((r) => r.eventName === 'PaymentRefunded');
    expect(refundEvent?.payload.status).toBe('REFUNDED');

    // Estoque restaurado.
    const stock = await inventoryRepo.findBySku('CAMERA-A7');
    expect(stock?.availableQuantity).toBe(5);
  });

  it('should reject checkout if inventory is insufficient without attempting payment', async () => {
    const orderRepo = new InMemoryOrderRepository();
    const inventoryRepo = new InMemoryInventoryRepository();
    const paymentAdapter = new MockEnterprisePaymentAdapter();
    const outbox = new EnterpriseOutbox();

    await inventoryRepo.save(new StockAggregate('DESK-ELECTRIC', 1));

    const saga = new CheckoutSagaOrchestrator(orderRepo, inventoryRepo, paymentAdapter, outbox);

    const result = await saga.execute({
      orderId: 'ord_capstone_003',
      customerId: 'cust_user_1',
      sku: 'DESK-ELECTRIC',
      quantity: 5, // Exceeds available stock (1)
      unitPrice: 800,
      creditCardToken: 'valid_card',
    });

    expect(result.status).toBe('REJECTED');
    expect(result.failureReason).toContain('Insufficient stock');
    expect(result.compensated).toBe(false); // Stock was never reserved, no compensation needed
  });

  it('should guarantee event delivery via the transactional outbox relay even if the broker is down at first', async () => {
    const orderRepo = new InMemoryOrderRepository();
    const inventoryRepo = new InMemoryInventoryRepository();
    const paymentAdapter = new MockEnterprisePaymentAdapter();
    const outbox = new EnterpriseOutbox();
    const broker = new MockEnterpriseEventBroker();
    const relay = new EnterpriseOutboxRelay(outbox, broker);

    await inventoryRepo.save(new StockAggregate('MONITOR-5K', 4));

    const saga = new CheckoutSagaOrchestrator(orderRepo, inventoryRepo, paymentAdapter, outbox);

    // Checkout confirma o pedido e grava eventos PENDING no outbox.
    const result = await saga.execute({
      orderId: 'ord_capstone_005',
      customerId: 'cust_corp_55',
      sku: 'MONITOR-5K',
      quantity: 2,
      unitPrice: 1200,
      creditCardToken: 'valid_card',
    });

    expect(result.status).toBe('CONFIRMED');
    // Todos os eventos nasceram PENDING (ainda não publicados no broker).
    expect(outbox.getPending()).toHaveLength(4);

    // Broker fora do ar: o relay tenta e falha, mas NÃO perde os eventos.
    broker.isHealthy = false;
    const run1 = await relay.publishPending();
    expect(run1.publishedCount).toBe(0);
    expect(run1.failedCount).toBe(4);
    expect(outbox.getPending()).toHaveLength(4); // continuam pendentes

    // Broker recupera: a próxima passada do relay publica tudo, uma única vez.
    broker.isHealthy = true;
    const run2 = await relay.publishPending();
    expect(run2.publishedCount).toBe(4);
    expect(outbox.getPending()).toHaveLength(0);
    expect(broker.published.map((m) => m.eventName)).toEqual([
      'OrderDraftCreated',
      'InventoryReserved',
      'PaymentAuthorized',
      'OrderConfirmed',
    ]);

    // Re-executar o relay não republica nada (idempotência do lado do outbox).
    const run3 = await relay.publishPending();
    expect(run3.publishedCount).toBe(0);
    expect(broker.published).toHaveLength(4);
  });
});
