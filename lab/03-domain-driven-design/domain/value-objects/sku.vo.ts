export class Sku {
  public readonly code: string;

  constructor(code: string) {
    const trimmed = code.trim().toUpperCase();
    if (!/^[A-Z0-9_-]{3,20}$/.test(trimmed)) {
      throw new Error(`Invalid SKU format: "${code}". Must be 3-20 alphanumeric characters.`);
    }
    this.code = trimmed;
    Object.freeze(this);
  }

  public equals(other: Sku): boolean {
    return this.code === other.code;
  }
}
