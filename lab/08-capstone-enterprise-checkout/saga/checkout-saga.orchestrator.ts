import { OrderAggregate } from '../orders/domain/order.aggregate.js';
import { PaymentAggregate } from '../payments/domain/payment.aggregate.js';
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

    // O contexto de Pagamentos tem seu próprio modelo de domínio com invariantes
    // de transição de estado (PENDING -> AUTHORIZED -> REFUNDED/FAILED). O gateway
    // é apenas o adaptador de saída (driven) que executa a chamada externa; quem
    // guarda as regras é o agregado.
    const payment = new PaymentAggregate(`pay_${order.id}`, order.id, order.totalAmount);

    let stockReserved = false;

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
        payment.fail(); // registra a transição de estado do domínio (-> FAILED)
        throw new Error(`Payment declined: ${paymentResult.error || 'Unknown decline'}`);
      }

      // O agregado valida e materializa a autorização (PENDING -> AUTHORIZED).
      payment.authorize(paymentResult.transactionId);
      this.outbox.logEvent('payments', 'PaymentAuthorized', {
        transactionId: payment.transactionId,
        amount: payment.amount,
        status: payment.status,
      });

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
      // Só compensamos o pagamento se o agregado chegou a AUTHORIZED. O próprio
      // agregado impede um refund inválido (invariante: só refunda autorizado).
      if (payment.status === 'AUTHORIZED' && payment.transactionId) {
        await this.paymentGateway.refund(payment.transactionId);
        payment.refund(); // AUTHORIZED -> REFUNDED
        this.outbox.logEvent('payments', 'PaymentRefunded', {
          transactionId: payment.transactionId,
          status: payment.status,
        });
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
