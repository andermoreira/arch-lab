import { describe, it, expect } from 'vitest';
import { Money } from './domain/value-objects/money.vo.js';
import { EmailAddress } from './domain/value-objects/email.vo.js';
import { Sku } from './domain/value-objects/sku.vo.js';
import { OrderAggregate } from './domain/aggregates/order.aggregate.js';
import { LegacySupplierAntiCorruptionLayer } from './acl/legacy-supplier.acl.js';

describe('Fase 3: Domain-Driven Design (DDD) Strategic & Tactical', () => {
  describe('Value Objects', () => {
    it('should maintain immutability and equality by value in Money VO', () => {
      const m1 = new Money(100.5, 'BRL');
      const m2 = new Money(100.5, 'BRL');
      const m3 = new Money(50.0, 'BRL');

      expect(m1.equals(m2)).toBe(true);
      expect(m1.equals(m3)).toBe(false);

      const sum = m1.add(m3);
      expect(sum.amount).toBe(150.5);
      expect(m1.amount).toBe(100.5); // Original unchanged (immutable)
    });

    it('should reject invalid email or negative money invariants', () => {
      expect(() => new Money(-10, 'BRL')).toThrow('cannot be negative');
      expect(() => new EmailAddress('invalid-email-address')).toThrow('Invalid email address format');
      expect(() => new Sku('!@#')).toThrow('Invalid SKU format');
    });
  });

  describe('Aggregate Root & Invariants', () => {
    it('should enforce business invariants and emit domain events on state change', () => {
      const email = new EmailAddress('alice@example.com');
      const order = new OrderAggregate('ord_001', email, 'BRL');

      order.addItem(new Sku('BOOK-CLEAN-ARCH'), new Money(120.0, 'BRL'), 2);
      order.addItem(new Sku('KBD-MECHANICAL'), new Money(350.0, 'BRL'), 1);

      expect(order.calculateTotal().amount).toBe(590.0);
      expect(order.domainEvents).toHaveLength(0);

      order.place();

      expect(order.state).toBe('PLACED');
      expect(order.domainEvents).toHaveLength(1);
      expect(order.domainEvents[0].eventType).toBe('OrderPlaced');

      // Invariant check: Cannot add items to placed order
      expect(() =>
        order.addItem(new Sku('MOUSE-OPTICAL'), new Money(50.0, 'BRL'), 1)
      ).toThrow('Cannot add items to an order in state "PLACED"');
    });

    it('should reject placing an empty order with zero items', () => {
      const order = new OrderAggregate('ord_002', new EmailAddress('bob@example.com'));
      expect(() => order.place()).toThrow('Cannot place an empty order with zero items');
    });
  });

  describe('Anti-Corruption Layer (ACL)', () => {
    it('should translate dirty legacy ERP payload into pristine domain aggregates', () => {
      const legacyPayload = {
        ORDER_NUM: 'LEGACY_9988',
        CLIENT_CONTACT: 'partner@enterprise.corp',
        CURR: 'BRL',
        LINE_ITEMS: [
          { PROD_CODE_RAW: '###SKU-ABC-123###', UNIT_VAL_CENTS: 1999, QTY: 3 },
          { PROD_CODE_RAW: 'PROD_XYZ_888', UNIT_VAL_CENTS: 5000, QTY: 1 },
        ],
      };

      const domainOrder = LegacySupplierAntiCorruptionLayer.toDomain(legacyPayload);

      expect(domainOrder.id).toBe('LEGACY_9988');
      expect(domainOrder.items).toHaveLength(2);
      expect(domainOrder.items[0].sku.code).toBe('SKU-ABC-123');
      expect(domainOrder.items[0].unitPrice.amount).toBe(19.99);
      expect(domainOrder.calculateTotal().amount).toBe(109.97);
    });
  });
});
