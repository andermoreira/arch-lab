import { describe, it, expect } from 'vitest';
import { CreateOrderService } from './application/create-order.service.js';
import { InMemoryOrderRepository } from './adapters/in-memory-order.repository.js';
import { MockPaymentGatewayAdapter } from './adapters/mock-payment-gateway.adapter.js';
import { MockNotificationAdapter } from './adapters/mock-notification.adapter.js';
import { HttpOrderController } from './adapters/http-order.controller.js';

describe('Fase 2: Hexagonal Architecture (Ports & Adapters)', () => {
  it('should successfully execute order creation with in-memory adapters', () => {
    const repository = new InMemoryOrderRepository();
    const paymentGateway = new MockPaymentGatewayAdapter(true);
    const notification = new MockNotificationAdapter();

    const service = new CreateOrderService(repository, paymentGateway, notification);
    const controller = new HttpOrderController(service);

    const request = {
      body: {
        customerId: 'cust_123',
        items: [
          { sku: 'LAPTOP-PRO', unitPrice: 1500, quantity: 1 },
          { sku: 'MOUSE-OPTICAL', unitPrice: 50, quantity: 2 },
        ],
        paymentToken: 'valid-token',
      },
    };

    return controller.handleCreateOrder(request).then(async (response) => {
      expect(response.statusCode).toBe(201);
      const data = response.body.data as { orderId: string; total: number; status: string };
      expect(data.total).toBe(1600);
      expect(data.status).toBe('PAID');

      // Verify secondary adapters updated
      expect(repository.count()).toBe(1);
      const saved = await repository.findById(data.orderId);
      expect(saved).not.toBeNull();
      expect(saved?.status).toBe('PAID');

      expect(notification.sentNotifications).toHaveLength(1);
      expect(notification.sentNotifications[0].total).toBe(1600);
    });
  });

  it('should handle payment failure cleanly without persisting corrupted order', async () => {
    const repository = new InMemoryOrderRepository();
    const paymentGateway = new MockPaymentGatewayAdapter(false); // Fails payment
    const notification = new MockNotificationAdapter();

    const service = new CreateOrderService(repository, paymentGateway, notification);
    const controller = new HttpOrderController(service);

    const response = await controller.handleCreateOrder({
      body: {
        customerId: 'cust_123',
        items: [{ sku: 'MONITOR-4K', unitPrice: 600, quantity: 1 }],
        paymentToken: 'invalid-card',
      },
    });

    expect(response.statusCode).toBe(422);
    expect(response.body.error).toContain('Payment failed');
    expect(repository.count()).toBe(0); // Nothing saved in repository
    expect(notification.sentNotifications).toHaveLength(0);
  });
});
