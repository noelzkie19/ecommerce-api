/**
 * Commission Value Object
 *
 * Represents a commission with type and value.
 * This is an immutable value object that ensures proper commission handling.
 */

import { Money, Currency } from "./Money";

export type CommissionType = "percentage" | "fixed";

/**
 * Commission value object
 */
export class Commission {
  readonly type: CommissionType;
  readonly value: number;
  readonly currency: Currency;

  private constructor(type: CommissionType, value: number, currency: Currency) {
    if (value < 0) {
      throw new Error("Commission value cannot be negative");
    }
    if (type === "percentage" && value > 100) {
      throw new Error("Percentage commission cannot exceed 100%");
    }
    this.type = type;
    this.value = value;
    this.currency = currency;
  }

  /**
   * Create a percentage-based commission
   */
  static percentage(value: number, currency: Currency = "PHP"): Commission {
    return new Commission("percentage", value, currency);
  }

  /**
   * Create a fixed amount commission
   */
  static fixed(value: number, currency: Currency = "PHP"): Commission {
    return new Commission("fixed", value, currency);
  }

  /**
   * Create a zero commission
   */
  static zero(currency: Currency = "PHP"): Commission {
    return new Commission("fixed", 0, currency);
  }

  /**
   * Calculate commission from a sale amount
   */
  calculate(saleAmount: Money): Money {
    if (this.isZero()) {
      return Money.zero(this.currency);
    }

    if (this.type === "percentage") {
      return saleAmount.percentage(this.value);
    }

    // Fixed commission
    return Money.create(Math.min(this.value, saleAmount.amount), this.currency);
  }

  /**
   * Check if commission is zero
   */
  isZero(): boolean {
    return this.value === 0;
  }

  /**
   * Check if commission is percentage-based
   */
  isPercentage(): boolean {
    return this.type === "percentage";
  }

  /**
   * Check if commission is fixed amount
   */
  isFixed(): boolean {
    return this.type === "fixed";
  }

  /**
   * Check if commission equals another
   */
  equals(other: Commission): boolean {
    return (
      this.type === other.type &&
      this.value === other.value &&
      this.currency === other.currency
    );
  }

  /**
   * Convert to plain object
   */
  toObject(): { type: CommissionType; value: number; currency: Currency } {
    return {
      type: this.type,
      value: this.value,
      currency: this.currency,
    };
  }

  /**
   * Convert to string representation
   */
  toString(): string {
    if (this.type === "percentage") {
      return `${this.value}%`;
    }
    return `${this.currency} ${this.value.toFixed(2)}`;
  }
}

/**
 * Affiliate Commission Settings
 * Contains commission configuration for affiliate products
 */
export class AffiliateCommission {
  readonly affiliateId: string;
  readonly productId: string;
  readonly commission: Commission;
  readonly createdAt: Date;

  private constructor(props: AffiliateCommissionProps) {
    this.affiliateId = props.affiliateId;
    this.productId = props.productId;
    this.commission = props.commission;
    this.createdAt = props.createdAt;
  }

  /**
   * Create from database row
   */
  static fromDatabase(row: AffiliateCommissionRow): AffiliateCommission {
    return new AffiliateCommission({
      affiliateId: row.affiliate_id,
      productId: row.product_id,
      commission:
        row.commission_type === "percentage"
          ? Commission.percentage(row.commission_value, "PHP")
          : Commission.fixed(row.commission_value, "PHP"),
      createdAt: new Date(row.created_at),
    });
  }

  /**
   * Calculate commission for a sale
   */
  calculateCommission(saleAmount: Money): Money {
    return this.commission.calculate(saleAmount);
  }
}

interface AffiliateCommissionProps {
  affiliateId: string;
  productId: string;
  commission: Commission;
  createdAt: Date;
}

interface AffiliateCommissionRow {
  affiliate_id: string;
  product_id: string;
  commission_type: CommissionType;
  commission_value: number;
  created_at: string;
}
