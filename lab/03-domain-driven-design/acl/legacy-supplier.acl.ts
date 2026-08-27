import { Money } from '../domain/value-objects/money.vo.js';
import { EmailAddress } from '../domain/value-objects/email.vo.js';
import { Sku } from '../domain/value-objects/sku.vo.js';
import { OrderAggregate } from '../domain/aggregates/order.aggregate.js';

// Messy, unstructured payload coming from a legacy 3rd party supplier system
export interface LegacySupplierOrderPayload {
  ORDER_NUM: string;
  CLIENT_CONTACT: string;
  CURR: string;
  LINE_ITEMS: Array<{
    PROD_CODE_RAW: string;
    UNIT_VAL_CENTS: number;
    QTY: number;
  }>;
}

export class LegacySupplierAntiCorruptionLayer {
  /**
   * Translates dirty legacy structures into pristine Domain Aggregates
   * without contaminating domain models with legacy field names.
   */
  public static toDomain(payload: LegacySupplierOrderPayload): OrderAggregate {
    if (!payload.ORDER_NUM) {
      throw new Error('Legacy payload missing ORDER_NUM');
    }

    const email = new EmailAddress(payload.CLIENT_CONTACT);
    const currency = payload.CURR || 'BRL';
    const order = new OrderAggregate(payload.ORDER_NUM, email, currency);

    for (const item of payload.LINE_ITEMS) {
      const cleanSku = item.PROD_CODE_RAW.replace(/[^a-zA-Z0-9_-]/g, '').toUpperCase();
      const sku = new Sku(cleanSku);
      const price = new Money(item.UNIT_VAL_CENTS / 100, currency);
      order.addItem(sku, price, item.QTY);
    }

    return order;
  }
}
