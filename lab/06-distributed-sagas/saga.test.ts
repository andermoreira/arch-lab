import { describe, it, expect } from 'vitest';
import { InventoryService } from './services/inventory.service.js';
import { PaymentService } from './services/payment.service.js';
import { ShippingService } from './services/shipping.service.js';
import { OrderFulfillmentSagaOrchestrator } from './saga-orchestrator.js';

describe('Fase 6: Distributed Transactions & The Saga Pattern', () => {
  it('should complete entire Saga successfully when all steps succeed', async () => {
    const inventory = new InventoryService({ 'PS5-CONSOLE': 5 });
    const payment = new PaymentService();
    const shipping = new ShippingService();

    const orchestrator = new OrderFulfillmentSagaOrchestrator(inventory, payment, shipping);

    const result = await orchestrator.execute({
      orderId: 'ord_101',
      sku: 'PS5-CONSOLE',
      quantity: 1,
      totalAmount: 500,
      cardNumber: '4111_VALID_CARD',
      shippingAddress: 'Av. Paulista, 1000, SP',
    });

    expect(result.status).toBe('COMPLETED');
    expect(result.executedSteps).toEqual(['RESERVE_INVENTORY', 'PROCESS_PAYMENT', 'SCHEDULE_SHIPPING']);
    expect(result.compensatedSteps).toHaveLength(0);
    expect(inventory.getStock('PS5-CONSOLE')).toBe(4); // 1 item deducted
    expect(shipping.scheduledDeliveries).toContain('ord_101');
  });

  it('should trigger automatic backward compensation when payment step fails', async () => {
    const inventory = new InventoryService({ 'MACBOOK-M3': 2 });
    const payment = new PaymentService();
    const shipping = new ShippingService();

    const orchestrator = new OrderFulfillmentSagaOrchestrator(inventory, payment, shipping);

    const result = await orchestrator.execute({
      orderId: 'ord_102',
      sku: 'MACBOOK-M3',
      quantity: 1,
      totalAmount: 2000,
      cardNumber: '4000_DECLINE_CARD', // Triggers payment decline
      shippingAddress: 'Rua Augusta, 500, SP',
    });

    // Rollback bem-sucedido -> estado consistente (COMPENSATED), não "falha".
    expect(result.status).toBe('COMPENSATED');
    expect(result.failureReason).toContain('Payment failed');
    expect(result.executedSteps).toEqual(['RESERVE_INVENTORY']);
    expect(result.compensatedSteps).toEqual(['RELEASE_INVENTORY']);
    expect(result.failedCompensations).toBeUndefined();

    // Crucial check: Inventory was restored! No orphaned/leaked stock!
    expect(inventory.getStock('MACBOOK-M3')).toBe(2);
    expect(shipping.scheduledDeliveries).toHaveLength(0);
  });

  it('should compensate payment and inventory if shipping address is invalid', async () => {
    const inventory = new InventoryService({ 'IPHONE-16': 10 });
    const payment = new PaymentService();
    const shipping = new ShippingService();

    const orchestrator = new OrderFulfillmentSagaOrchestrator(inventory, payment, shipping);

    const result = await orchestrator.execute({
      orderId: 'ord_103',
      sku: 'IPHONE-16',
      quantity: 2,
      totalAmount: 1800,
      cardNumber: '4111_VALID_CARD',
      shippingAddress: '', // Invalid address causing shipping failure
    });

    expect(result.status).toBe('COMPENSATED');
    expect(result.executedSteps).toEqual(['RESERVE_INVENTORY', 'PROCESS_PAYMENT']);
    expect(result.compensatedSteps).toEqual(['REFUND_PAYMENT', 'RELEASE_INVENTORY']);
    expect(inventory.getStock('IPHONE-16')).toBe(10); // Fully restored
  });

  it('should surface COMPENSATION_FAILED when a compensating transaction itself fails', async () => {
    const inventory = new InventoryService({ 'GPU-4090': 4 });
    const payment = new PaymentService();
    const shipping = new ShippingService();

    // Simula um gateway de refund fora do ar: a compensação de pagamento falha.
    payment.refund = async () => {
      throw new Error('Refund gateway timeout');
    };

    const orchestrator = new OrderFulfillmentSagaOrchestrator(inventory, payment, shipping);

    const result = await orchestrator.execute({
      orderId: 'ord_104',
      sku: 'GPU-4090',
      quantity: 1,
      totalAmount: 1500,
      cardNumber: '4111_VALID_CARD',
      shippingAddress: '', // Falha no shipping dispara compensação de pagamento + estoque
    });

    // O rollback NÃO ficou limpo: o refund falhou -> exige intervenção.
    expect(result.status).toBe('COMPENSATION_FAILED');
    expect(result.failedCompensations).toEqual(['REFUND_PAYMENT']);
    // O estoque ainda foi restaurado (essa compensação teve sucesso).
    expect(result.compensatedSteps).toEqual(['RELEASE_INVENTORY']);
    expect(inventory.getStock('GPU-4090')).toBe(4);
  });
});
