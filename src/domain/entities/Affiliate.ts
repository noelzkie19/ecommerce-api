/**
 * Affiliate Entity
 *
 * Represents an affiliate in the e-commerce platform.
 * This is a core domain entity that contains pure business logic.
 */

export type AffiliateStatus = "pending" | "active" | "suspended";
export type PaymentStatus = "paid" | "unpaid";

/**
 * Affiliate entity with business logic
 */
export class Affiliate {
  readonly id: string;
  readonly userId: string;
  readonly email: string;
  readonly name: string;
  readonly status: AffiliateStatus;
  readonly paymentStatus: PaymentStatus;
  readonly affiliateLink: string | null;
  readonly storeId: string | null;
  readonly pixelId: string | null;
  readonly referredBy: string | null;
  readonly totalSales: number;
  readonly totalCommissions: number;
  readonly affiliateCommission: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  private constructor(props: AffiliateProps) {
    this.id = props.id;
    this.userId = props.userId;
    this.email = props.email;
    this.name = props.name;
    this.status = props.status;
    this.paymentStatus = props.paymentStatus;
    this.affiliateLink = props.affiliateLink;
    this.storeId = props.storeId;
    this.pixelId = props.pixelId;
    this.referredBy = props.referredBy;
    this.totalSales = props.totalSales;
    this.totalCommissions = props.totalCommissions;
    this.affiliateCommission = props.affiliateCommission;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  /**
   * Factory method to create a new Affiliate
   */
  static create(props: CreateAffiliateProps): Affiliate {
    return new Affiliate({
      id: props.id,
      userId: props.userId,
      email: props.email,
      name: props.name,
      status: props.status ?? "pending",
      paymentStatus: props.paymentStatus ?? "unpaid",
      affiliateLink: props.affiliateLink ?? null,
      storeId: props.storeId ?? null,
      pixelId: props.pixelId ?? null,
      referredBy: props.referredBy ?? null,
      totalSales: props.totalSales ?? 0,
      totalCommissions: props.totalCommissions ?? 0,
      affiliateCommission: props.affiliateCommission ?? 0,
      createdAt: props.createdAt ?? new Date(),
      updatedAt: props.updatedAt ?? new Date(),
    });
  }

  /**
   * Create Affiliate from database row
   */
  static fromDatabase(row: AffiliateDatabaseRow): Affiliate {
    return new Affiliate({
      id: row.id,
      userId: row.user_id,
      email: row.email,
      name: row.name,
      status: row.status,
      paymentStatus: row.payment_status,
      affiliateLink: row.affiliate_link,
      storeId: row.store_id,
      pixelId: row.pixel_id,
      referredBy: row.referred_by,
      totalSales: row.total_sales ?? 0,
      totalCommissions: row.total_commissions ?? 0,
      affiliateCommission: row.affiliate_commission ?? 0,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    });
  }

  /**
   * Check if affiliate can be activated
   */
  canBeActivated(): boolean {
    return this.paymentStatus === "paid" && this.status === "pending";
  }

  /**
   * Check if affiliate is active
   */
  isActive(): boolean {
    return this.status === "active" && this.paymentStatus === "paid";
  }

  /**
   * Check if affiliate has a referrer
   */
  hasReferrer(): boolean {
    return this.referredBy !== null;
  }

  /**
   * Activate the affiliate
   */
  activate(): Affiliate {
    if (!this.canBeActivated()) {
      throw new Error(
        "Affiliate cannot be activated. Payment may not be completed.",
      );
    }
    return new Affiliate({
      ...this.toProps(),
      status: "active",
      updatedAt: new Date(),
    });
  }

  /**
   * Suspend the affiliate
   */
  suspend(): Affiliate {
    return new Affiliate({
      ...this.toProps(),
      status: "suspended",
      updatedAt: new Date(),
    });
  }

  /**
   * Mark payment as paid
   */
  markAsPaid(): Affiliate {
    return new Affiliate({
      ...this.toProps(),
      paymentStatus: "paid",
      updatedAt: new Date(),
    });
  }

  /**
   * Generate affiliate link
   */
  generateLink(frontendUrl: string): string {
    if (!this.affiliateLink) {
      throw new Error("Affiliate link not generated");
    }
    return `${frontendUrl}/register?ref=${this.affiliateLink}`;
  }

  /**
   * Convert to plain object for response
   */
  toResponse(): AffiliateResponse {
    return {
      id: this.id,
      userId: this.userId,
      email: this.email,
      name: this.name,
      status: this.status,
      paymentStatus: this.paymentStatus,
      affiliateLink: this.affiliateLink,
      storeId: this.storeId,
      pixelId: this.pixelId,
      referredBy: this.referredBy,
      totalSales: this.totalSales,
      totalCommissions: this.totalCommissions,
      affiliateCommission: this.affiliateCommission,
      createdAt:
        this.createdAt && !Number.isNaN(this.createdAt.getTime())
          ? this.createdAt.toISOString()
          : null,
      updatedAt:
        this.updatedAt && !Number.isNaN(this.updatedAt.getTime())
          ? this.updatedAt.toISOString()
          : null,
    };
  }

  private toProps(): AffiliateProps {
    return {
      id: this.id,
      userId: this.userId,
      email: this.email,
      name: this.name,
      status: this.status,
      paymentStatus: this.paymentStatus,
      affiliateLink: this.affiliateLink,
      storeId: this.storeId,
      pixelId: this.pixelId,
      referredBy: this.referredBy,
      totalSales: this.totalSales,
      totalCommissions: this.totalCommissions,
      affiliateCommission: this.affiliateCommission,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

/**
 * Affiliate properties (internal)
 */
interface AffiliateProps {
  id: string;
  userId: string;
  email: string;
  name: string;
  status: AffiliateStatus;
  paymentStatus: PaymentStatus;
  affiliateLink: string | null;
  storeId: string | null;
  pixelId: string | null;
  referredBy: string | null;
  totalSales: number;
  totalCommissions: number;
  affiliateCommission: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Properties for creating a new Affiliate
 */
export interface CreateAffiliateProps {
  id: string;
  userId: string;
  email: string;
  name: string;
  status?: AffiliateStatus;
  paymentStatus?: PaymentStatus;
  affiliateLink?: string | null;
  storeId?: string | null;
  pixelId?: string | null;
  referredBy?: string | null;
  totalSales?: number;
  totalCommissions?: number;
  affiliateCommission?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Database row type (snake_case from Supabase)
 */
export interface AffiliateDatabaseRow {
  id: string;
  user_id: string;
  email: string;
  name: string;
  status: AffiliateStatus;
  payment_status: PaymentStatus;
  affiliate_link: string | null;
  store_id: string | null;
  pixel_id: string | null;
  referred_by: string | null;
  total_sales: number | null;
  total_commissions: number | null;
  affiliate_commission: number | null;
  created_at: string;
  updated_at: string;
}

/**
 * API Response type
 */
export interface AffiliateResponse {
  id: string;
  userId: string;
  email: string;
  name: string;
  status: AffiliateStatus;
  paymentStatus: PaymentStatus;
  affiliateLink: string | null;
  storeId: string | null;
  pixelId: string | null;
  referredBy: string | null;
  totalSales: number;
  totalCommissions: number;
  affiliateCommission: number;
  createdAt: string | null;
  updatedAt: string | null;
}
