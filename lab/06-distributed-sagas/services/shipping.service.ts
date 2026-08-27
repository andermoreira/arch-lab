export class ShippingService {
  public scheduledDeliveries: string[] = [];

  public async scheduleDelivery(orderId: string, address: string): Promise<boolean> {
    if (!address || address.length < 5) {
      return false;
    }
    this.scheduledDeliveries.push(orderId);
    return true;
  }
}
