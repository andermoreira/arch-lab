import { Order } from '../domain/order.js';
import type {
  CreateOrderUseCase,
  CreateOrderCommand,
  CreateOrderResult,
} from '../ports/driving/create-order.usecase.js';
import type { OrderRepositoryPort } from '../ports/driven/order-repository.port.js';
import type { PaymentGatewayPort } from '../ports/driven/payment-gateway.port.js';
import type { NotificationPort } from '../ports/driven/notification.port.js';

export class CreateOrderService implements CreateOrderUseCase {
  constructor(
    private readonly orderRepository: OrderRepositoryPort,
    private readonly paymentGateway: PaymentGatewayPort,
    private readonly notificationService: NotificationPort
  ) {}

  public async execute(command: CreateOrderCommand): Promise<CreateOrderResult> {
    const orderId = `ord_${Math.random().toString(36).substring(2, 9)}`;
    const order = new Order(orderId, command.customerId, command.items);

    const total = order.calculateTotal();

    // 1. Process payment via driven port
    const payment = await this.paymentGateway.charge(total, command.paymentToken);
    if (!payment.success) {
      throw new Error(`Payment failed: ${payment.errorMessage || 'Unknown error'}`);
    }

    // 2. Mutate domain state
    order.markAsPaid();

    // 3. Persist order via driven port
    await this.orderRepository.save(order);

    // 4. Notify customer via driven port
    await this.notificationService.sendOrderConfirmation(order.customerId, order.id, total);

    return {
      orderId: order.id,
      total,
      status: order.status,
      transactionId: payment.transactionId,
    };
  }
}
