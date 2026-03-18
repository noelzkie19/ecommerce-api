/**
 * Money Value Object
 *
 * Represents a monetary value with currency.
 * This is an immutable value object that ensures proper handling of money.
 */

export type Currency = "PHP" | "USD";

const SUPPORTED_CURRENCIES = new Set<Currency>(["PHP", "USD"]);

/**
 * Money value object
 */
export class Money {
  readonly amount: number;
  readonly currency: Currency;

  private constructor(amount: number, currency: Currency) {
    if (amount < 0) {
      throw new Error("Money amount cannot be negative");
    }
    this.amount = Math.round(amount * 100) / 100; // Round to 2 decimal places
    this.currency = currency;
  }

  /**
   * Create Money from amount and currency
   */
  static create(amount: number, currency: Currency = "PHP"): Money {
    if (!SUPPORTED_CURRENCIES.has(currency)) {
      throw new Error(`Unsupported currency: ${currency}`);
    }
    return new Money(amount, currency);
  }

  /**
   * Create PHP Money
   */
  static php(amount: number): Money {
    return new Money(amount, "PHP");
  }

  /**
   * Create USD Money
   */
  static usd(amount: number): Money {
    return new Money(amount, "USD");
  }

  /**
   * Create zero money
   */
  static zero(currency: Currency = "PHP"): Money {
    return new Money(0, currency);
  }

  /**
   * Add two Money values (must be same currency)
   */
  add(other: Money): Money {
    this.ensureSameCurrency(other);
    return new Money(this.amount + other.amount, this.currency);
  }

  /**
   * Subtract two Money values (must be same currency)
   */
  subtract(other: Money): Money {
    this.ensureSameCurrency(other);
    const result = this.amount - other.amount;
    if (result < 0) {
      throw new Error("Money subtraction would result in negative amount");
    }
    return new Money(result, this.currency);
  }

  /**
   * Multiply money by a factor
   */
  multiply(factor: number): Money {
    return new Money(this.amount * factor, this.currency);
  }

  /**
   * Calculate percentage of money
   */
  percentage(percent: number): Money {
    return new Money((this.amount * percent) / 100, this.currency);
  }

  /**
   * Check if money is zero
   */
  isZero(): boolean {
    return this.amount === 0;
  }

  /**
   * Check if money is greater than other
   */
  isGreaterThan(other: Money): boolean {
    this.ensureSameCurrency(other);
    return this.amount > other.amount;
  }

  /**
   * Check if money is less than other
   */
  isLessThan(other: Money): boolean {
    this.ensureSameCurrency(other);
    return this.amount < other.amount;
  }

  /**
   * Check if money equals other
   */
  equals(other: Money): boolean {
    return this.amount === other.amount && this.currency === other.currency;
  }

  /**
   * Format money as string
   */
  format(locale: string = "en-PH"): string {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: this.currency,
    }).format(this.amount);
  }

  /**
   * Convert to plain object
   */
  toObject(): { amount: number; currency: Currency } {
    return {
      amount: this.amount,
      currency: this.currency,
    };
  }

  /**
   * Convert to string representation
   */
  toString(): string {
    return `${this.currency} ${this.amount.toFixed(2)}`;
  }

  private ensureSameCurrency(other: Money): void {
    if (this.currency !== other.currency) {
      throw new Error(
        `Cannot operate on different currencies: ${this.currency} and ${other.currency}`,
      );
    }
  }
}
