/**
 * Affiliate Entity
 *
 * Represents an affiliate in the e-commerce platform.
 * This is a core domain entity that contains pure business logic.
 */

export type AffiliateStatus = "pending" | "active" | "suspended" | "rejected";
export type PaymentStatus = "paid" | "unpaid";
export type ConversionValueType = "sale_amount" | "commission" | "fixed";

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
  readonly pixelAccessToken: string | null;
  readonly enablePurchaseEvent: boolean;
  readonly enableLeadEvent: boolean;
  readonly conversionValueType: ConversionValueType;
  readonly conversionValueFixed: number | null;
  readonly referredBy: string | null;
  readonly totalSales: number;
  readonly totalCommissions: number;
  readonly affiliateCommission: number;
  readonly paymentProofUrl: string | null;
  readonly paymentProofRef: string | null;
  readonly paymentProofSubmittedAt: Date | null;
  readonly approvedBy: string | null;
  readonly approvedAt: Date | null;
  readonly rejectionReason: string | null;
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
    this.pixelAccessToken = props.pixelAccessToken ?? null;
    this.enablePurchaseEvent = props.enablePurchaseEvent ?? false;
    this.enableLeadEvent = props.enableLeadEvent ?? false;
    this.conversionValueType = props.conversionValueType ?? "sale_amount";
    this.conversionValueFixed = props.conversionValueFixed ?? null;
    this.referredBy = props.referredBy;
    this.totalSales = props.totalSales;
    this.totalCommissions = props.totalCommissions;
    this.affiliateCommission = props.affiliateCommission;
    this.paymentProofUrl = props.paymentProofUrl ?? null;
    this.paymentProofRef = props.paymentProofRef ?? null;
    this.paymentProofSubmittedAt = props.paymentProofSubmittedAt ?? null;
    this.approvedBy = props.approvedBy ?? null;
    this.approvedAt = props.approvedAt ?? null;
    this.rejectionReason = props.rejectionReason ?? null;
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
      pixelAccessToken: props.pixelAccessToken ?? null,
      enablePurchaseEvent: props.enablePurchaseEvent ?? false,
      enableLeadEvent: props.enableLeadEvent ?? false,
      conversionValueType: props.conversionValueType ?? "sale_amount",
      conversionValueFixed: props.conversionValueFixed ?? null,
      referredBy: props.referredBy ?? null,
      totalSales: props.totalSales ?? 0,
      totalCommissions: props.totalCommissions ?? 0,
      affiliateCommission: props.affiliateCommission ?? 0,
      paymentProofUrl: props.paymentProofUrl ?? null,
      paymentProofRef: props.paymentProofRef ?? null,
      paymentProofSubmittedAt: props.paymentProofSubmittedAt ?? null,
      approvedBy: props.approvedBy ?? null,
      approvedAt: props.approvedAt ?? null,
      rejectionReason: props.rejectionReason ?? null,
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
      pixelId: row.pixel_id ?? null,
      pixelAccessToken: (row as any).pixel_access_token ?? null,
      enablePurchaseEvent: (row as any).enable_purchase_event ?? false,
      enableLeadEvent: (row as any).enable_lead_event ?? false,
      conversionValueType: (row as any).conversion_value_type ?? "sale_amount",
      conversionValueFixed: (row as any).conversion_value_fixed ?? null,
      referredBy: row.referred_by,
      totalSales: row.total_sales ?? 0,
      totalCommissions: row.total_commissions ?? 0,
      affiliateCommission: row.affiliate_commission ?? 0,
      paymentProofUrl: row.payment_proof_url ?? null,
      paymentProofRef: row.payment_proof_ref ?? null,
      paymentProofSubmittedAt: row.payment_proof_submitted_at
        ? new Date(row.payment_proof_submitted_at)
        : null,
      approvedBy: row.approved_by ?? null,
      approvedAt: row.approved_at ? new Date(row.approved_at) : null,
      rejectionReason: row.rejection_reason ?? null,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    });
  }

  /**
   * Check if affiliate can be activated
   * Either paid via PayMongo (legacy) OR has submitted payment proof
   */
  canBeActivated(): boolean {
    return (
      this.status === "pending" &&
      (this.paymentStatus === "paid" || this.paymentProofSubmittedAt !== null)
    );
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
      pixelAccessToken: this.pixelAccessToken,
      enablePurchaseEvent: this.enablePurchaseEvent,
      enableLeadEvent: this.enableLeadEvent,
      conversionValueType: this.conversionValueType,
      conversionValueFixed: this.conversionValueFixed,
      referredBy: this.referredBy,
      totalSales: this.totalSales,
      totalCommissions: this.totalCommissions,
      affiliateCommission: this.affiliateCommission,
      paymentProofUrl: this.paymentProofUrl,
      paymentProofRef: this.paymentProofRef,
      paymentProofSubmittedAt: this.paymentProofSubmittedAt
        ? this.paymentProofSubmittedAt.toISOString()
        : null,
      approvedBy: this.approvedBy,
      approvedAt: this.approvedAt ? this.approvedAt.toISOString() : null,
      rejectionReason: this.rejectionReason,
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
      pixelAccessToken: this.pixelAccessToken,
      enablePurchaseEvent: this.enablePurchaseEvent,
      enableLeadEvent: this.enableLeadEvent,
      conversionValueType: this.conversionValueType,
      conversionValueFixed: this.conversionValueFixed,
      referredBy: this.referredBy,
      totalSales: this.totalSales,
      totalCommissions: this.totalCommissions,
      affiliateCommission: this.affiliateCommission,
      paymentProofUrl: this.paymentProofUrl,
      paymentProofRef: this.paymentProofRef,
      paymentProofSubmittedAt: this.paymentProofSubmittedAt,
      approvedBy: this.approvedBy,
      approvedAt: this.approvedAt,
      rejectionReason: this.rejectionReason,
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
  pixelAccessToken: string | null;
  enablePurchaseEvent: boolean;
  enableLeadEvent: boolean;
  conversionValueType: ConversionValueType;
  conversionValueFixed: number | null;
  referredBy: string | null;
  totalSales: number;
  totalCommissions: number;
  affiliateCommission: number;
  paymentProofUrl: string | null;
  paymentProofRef: string | null;
  paymentProofSubmittedAt: Date | null;
  approvedBy: string | null;
  approvedAt: Date | null;
  rejectionReason: string | null;
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
  pixelAccessToken?: string | null;
  enablePurchaseEvent?: boolean;
  enableLeadEvent?: boolean;
  conversionValueType?: ConversionValueType;
  conversionValueFixed?: number | null;
  referredBy?: string | null;
  totalSales?: number;
  totalCommissions?: number;
  affiliateCommission?: number;
  paymentProofUrl?: string | null;
  paymentProofRef?: string | null;
  paymentProofSubmittedAt?: Date | null;
  approvedBy?: string | null;
  approvedAt?: Date | null;
  rejectionReason?: string | null;
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
  payment_proof_url: string | null;
  payment_proof_ref: string | null;
  payment_proof_submitted_at: string | null;
  approved_by: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
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
  pixelAccessToken: string | null;
  enablePurchaseEvent: boolean;
  enableLeadEvent: boolean;
  conversionValueType: ConversionValueType;
  conversionValueFixed: number | null;
  referredBy: string | null;
  totalSales: number;
  totalCommissions: number;
  affiliateCommission: number;
  paymentProofUrl: string | null;
  paymentProofRef: string | null;
  paymentProofSubmittedAt: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  rejectionReason: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}
