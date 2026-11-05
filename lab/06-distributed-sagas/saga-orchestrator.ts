import type { InventoryService } from './services/inventory.service.js';
import type { PaymentService } from './services/payment.service.js';
import type { ShippingService } from './services/shipping.service.js';

export type SagaStatus =
  | 'NOT_STARTED'
  | 'INVENTORY_RESERVED'
  | 'PAYMENT_CHARGED'
  | 'SHIPPING_SCHEDULED'
  | 'COMPLETED'
  | 'COMPENSATING'
  // Rollback executado com sucesso: o sistema voltou a um estado consistente.
  | 'COMPENSATED'
  // Uma transação compensatória FALHOU: o sistema ficou inconsistente e exige
  // intervenção (dead-letter / retry / semantic lock). É o caso mais difícil das
  // sagas — por isso é um estado terminal explícito, não um detalhe escondido.
  | 'COMPENSATION_FAILED';

export interface CheckoutSagaInput {
  orderId: string;
  sku: string;
  quantity: number;
  totalAmount: number;
  cardNumber: string;
  shippingAddress: string;
}

export interface SagaExecutionResult {
  sagaId: string;
  status: SagaStatus;
  executedSteps: string[];
  compensatedSteps: string[];
  failureReason?: string;
  /** Passos de compensação que falharam (exigem intervenção manual). */
  failedCompensations?: string[];
}

export class OrderFulfillmentSagaOrchestrator {
  constructor(
    private readonly inventoryService: InventoryService,
    private readonly paymentService: PaymentService,
    private readonly shippingService: ShippingService
  ) {}

  public async execute(input: CheckoutSagaInput): Promise<SagaExecutionResult> {
    const sagaId = `saga_${Math.random().toString(36).substring(2, 9)}`;
    const executedSteps: string[] = [];
    const compensatedSteps: string[] = [];
    let status: SagaStatus = 'NOT_STARTED';

    let inventoryReserved = false;
    let paymentTransactionId: string | undefined;

    try {
      // Step 1: Reserve Inventory
      const reserved = await this.inventoryService.reserve(input.sku, input.quantity);
      if (!reserved) {
        throw new Error(`Insufficient inventory for SKU: ${input.sku}`);
      }
      inventoryReserved = true;
      status = 'INVENTORY_RESERVED';
      executedSteps.push('RESERVE_INVENTORY');

      // Step 2: Process Payment
      const payment = await this.paymentService.charge(input.totalAmount, input.cardNumber);
      if (!payment.success) {
        throw new Error(`Payment failed: ${payment.reason}`);
      }
      paymentTransactionId = payment.transactionId;
      status = 'PAYMENT_CHARGED';
      executedSteps.push('PROCESS_PAYMENT');

      // Step 3: Schedule Shipping
      const shippingOk = await this.shippingService.scheduleDelivery(input.orderId, input.shippingAddress);
      if (!shippingOk) {
        throw new Error('Invalid shipping address');
      }
      status = 'COMPLETED';
      executedSteps.push('SCHEDULE_SHIPPING');

      return {
        sagaId,
        status, // usa o estado rastreado ('COMPLETED'), não um literal solto
        executedSteps,
        compensatedSteps,
      };
    } catch (error: unknown) {
      status = 'COMPENSATING';
      const reason = error instanceof Error ? error.message : 'Unknown error';
      const failedCompensations: string[] = [];

      // Compensações em ordem reversa (backward recovery). Cada compensação é
      // envolvida em try/catch: numa saga real, uma compensação também pode
      // falhar (o gateway de refund pode estar fora do ar). Nesse caso o
      // sistema NÃO volta a um estado consistente sozinho — registramos o passo
      // como pendente de intervenção em vez de fingir que o rollback foi limpo.
      if (paymentTransactionId) {
        try {
          await this.paymentService.refund(paymentTransactionId);
          compensatedSteps.push('REFUND_PAYMENT');
        } catch {
          failedCompensations.push('REFUND_PAYMENT');
        }
      }

      if (inventoryReserved) {
        try {
          await this.inventoryService.release(input.sku, input.quantity);
          compensatedSteps.push('RELEASE_INVENTORY');
        } catch {
          failedCompensations.push('RELEASE_INVENTORY');
        }
      }

      status = failedCompensations.length > 0 ? 'COMPENSATION_FAILED' : 'COMPENSATED';

      return {
        sagaId,
        status,
        executedSteps,
        compensatedSteps,
        failureReason: reason,
        ...(failedCompensations.length > 0 ? { failedCompensations } : {}),
      };
    }
  }
}
