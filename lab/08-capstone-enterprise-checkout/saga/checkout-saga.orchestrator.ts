import { OrderAggregate } from '../orders/domain/order.aggregate.js';
import type { OrderRepositoryPort } from '../orders/ports/order.repository.port.js';
import type { InventoryRepositoryPort } from '../inventory/ports/inventory.repository.port.js';
import type { PaymentGatewayPort } from '../payments/ports/payment-gateway.port.js';
import type { EnterpriseOutbox } from '../outbox/enterprise-outbox.js';

export interface CheckoutRequest {
  orderId: string;
  customerId: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  creditCardToken: string;
}

export interface CheckoutResult {
  orderId: string;
  status: 'CONFIRMED' | 'REJECTED';
  totalAmount: number;
  failureReason?: string;
  compensated: boolean;
}

export class CheckoutSagaOrchestrator {
  constructor(
    private readonly orderRepository: OrderRepositoryPort,
    private readonly inventoryRepository: InventoryRepositoryPort,
    private readonly paymentGateway: PaymentGatewayPort,
    private readonly outbox: EnterpriseOutbox
  ) {}

  public async execute(request: CheckoutRequest): Promise<CheckoutResult> {
    const order = new OrderAggregate(
      request.orderId,
      request.customerId,
      request.sku,
      request.quantity,
      request.unitPrice
    );

    // Save initial draft order
    await this.orderRepository.save(order);
    this.outbox.logEvent('orders', 'OrderDraftCreated', { orderId: order.id, total: order.totalAmount });

    let stockReserved = false;
    let authTransactionId: string | undefined;

    try {
      // Step 1: Reserve Inventory
      const stock = await this.inventoryRepository.findBySku(request.sku);
      if (!stock) {
        throw new Error(`SKU "${request.sku}" not found in inventory catalog`);
      }

      stock.reserve(request.quantity);
      await this.inventoryRepository.save(stock);
      stockReserved = true;
      this.outbox.logEvent('inventory', 'InventoryReserved', { sku: request.sku, quantity: request.quantity });

      // Step 2: Process Payment
      const paymentResult = await this.paymentGateway.authorize(order.totalAmount, request.creditCardToken);
      if (!paymentResult.success || !paymentResult.transactionId) {
        throw new Error(`Payment declined: ${paymentResult.error || 'Unknown decline'}`);
      }

      authTransactionId = paymentResult.transactionId;
      this.outbox.logEvent('payments', 'PaymentAuthorized', { transactionId: authTransactionId, amount: order.totalAmount });

      // Step 3: Confirm Order
      order.confirm();
      await this.orderRepository.save(order);
      this.outbox.logEvent('orders', 'OrderConfirmed', { orderId: order.id });

      return {
        orderId: order.id,
        status: 'CONFIRMED',
        totalAmount: order.totalAmount,
        compensated: false,
      };
    } catch (error: unknown) {
      const reason = error instanceof Error ? error.message : 'Checkout failure';

      // --- Backward Compensations ---
      if (authTransactionId) {
        await this.paymentGateway.refund(authTransactionId);
        this.outbox.logEvent('payments', 'PaymentRefunded', { transactionId: authTransactionId });
      }

      if (stockReserved) {
        const stock = await this.inventoryRepository.findBySku(request.sku);
        if (stock) {
          stock.release(request.quantity);
          await this.inventoryRepository.save(stock);
          this.outbox.logEvent('inventory', 'InventoryCompensationReleased', { sku: request.sku, quantity: request.quantity });
        }
      }

      order.cancel();
      await this.orderRepository.save(order);
      this.outbox.logEvent('orders', 'OrderCancelled', { orderId: order.id, reason });

      return {
        orderId: order.id,
        status: 'REJECTED',
        totalAmount: order.totalAmount,
        failureReason: reason,
        compensated: stockReserved,
      };
    }
  }
}
