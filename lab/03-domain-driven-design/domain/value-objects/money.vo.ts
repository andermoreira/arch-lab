export class Money {
  public readonly amount: number;
  public readonly currency: string;

  constructor(amount: number, currency: string = 'BRL') {
    if (amount < 0) {
      throw new Error(`Money amount cannot be negative. Provided: ${amount}`);
    }
    if (!currency || currency.length !== 3) {
      throw new Error(`Invalid ISO-4217 currency code: "${currency}"`);
    }
    // Round to 2 decimal places to avoid floating point drift
    this.amount = Math.round(amount * 100) / 100;
    this.currency = currency.toUpperCase();
    Object.freeze(this);
  }

  public static zero(currency: string = 'BRL'): Money {
    return new Money(0, currency);
  }

  public add(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this.amount + other.amount, this.currency);
  }

  public subtract(other: Money): Money {
    this.assertSameCurrency(other);
    if (this.amount < other.amount) {
      throw new Error(`Insufficient funds: cannot subtract ${other.amount} from ${this.amount}`);
    }
    return new Money(this.amount - other.amount, this.currency);
  }

  public multiply(factor: number): Money {
    if (factor < 0) throw new Error('Multiplication factor cannot be negative');
    return new Money(this.amount * factor, this.currency);
  }

  public equals(other: Money): boolean {
    return this.amount === other.amount && this.currency === other.currency;
  }

  private assertSameCurrency(other: Money): void {
    if (this.currency !== other.currency) {
      throw new Error(`Currency mismatch: cannot operate on ${this.currency} and ${other.currency}`);
    }
  }
}
