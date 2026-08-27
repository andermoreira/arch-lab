export class EmailAddress {
  public readonly value: string;

  constructor(value: string) {
    const trimmed = value.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      throw new Error(`Invalid email address format: "${value}"`);
    }
    this.value = trimmed;
    Object.freeze(this);
  }

  public equals(other: EmailAddress): boolean {
    return this.value === other.value;
  }
}
