import type { NotificationPort } from '../ports/driven/notification.port.js';

export interface SentNotification {
  customerId: string;
  orderId: string;
  total: number;
  sentAt: Date;
}

export class MockNotificationAdapter implements NotificationPort {
  public readonly sentNotifications: SentNotification[] = [];

  public async sendOrderConfirmation(customerId: string, orderId: string, total: number): Promise<void> {
    this.sentNotifications.push({
      customerId,
      orderId,
      total,
      sentAt: new Date(),
    });
  }
}
