// Pure Domain Entity - ZERO infrastructure imports
export class CleanOrder {
  constructor(
    public readonly id: string,
    public readonly customerId: string,
    public readonly amount: number
  ) {
    if (amount <= 0) {
      throw new Error('Order amount must be positive');
    }
  }
}
