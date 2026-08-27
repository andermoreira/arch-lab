import { Order } from '../../domain/order.js';

export interface CreateOrderCommand {
  customerId: string;
  items: Array<{ sku: string; unitPrice: number; quantity: number }>;
  paymentToken: string;
}

export interface CreateOrderResult {
  orderId: string;
  total: number;
  status: string;
  transactionId: string;
}

export interface CreateOrderUseCase {
  execute(command: CreateOrderCommand): Promise<CreateOrderResult>;
}
