export type AffiliateStatus = "pending" | "active" | "suspended";
export type CommissionType = "percentage" | "fixed";
export type PaymentStatus = "unpaid" | "paid";

// ── Affiliate ─────────────────────────────────────────────────────────────────

export interface Affiliate {
  id: string;
  userId: string | null; // ← linked auth.users id
  name: string;
  email: string;
  status: AffiliateStatus;
  paymentStatus: PaymentStatus; // ← whether affiliate has paid
  pixelId?: string; // ← Meta Pixel ID for tracking
  storeId?: string; // ← Store ID for affiliate
  createdAt: string;
  updatedAt: string;
  /** Derived / joined fields returned by the repository */
  productCount?: number;
  totalSales?: number;
  totalCommissions?: number;
}

// ── Affiliate Product assignment ──────────────────────────────────────────────

export interface AffiliateProduct {
  id: string;
  affiliateId: string;
  productId: string;
  commissionType: CommissionType;
  commissionValue: number;
  createdAt: string;
  product?: {
    id: string;
    name: string;
    price: number;
    image_url: string | null;
  };
}

// ── DTOs ──────────────────────────────────────────────────────────────────────

/**
 * Admin provides an email; the service looks it up in auth.users
 * and pulls name + user_id automatically.
 */
export interface CreateAffiliateDTO {
  email: string;
  pixelId?: string; // ← Meta Pixel ID for tracking
  storeId?: string; // ← Store ID for affiliate
  status?: AffiliateStatus; // ← Status for auto-creation
}

export interface UpdateAffiliateDTO {
  name?: string;
  email?: string;
  status?: AffiliateStatus;
  paymentStatus?: PaymentStatus;
  pixelId?: string; // ← Meta Pixel ID for tracking
  storeId?: string; // ← Store ID for affiliate
}

export interface AssignProductDTO {
  productId: string;
  commissionType: CommissionType;
  commissionValue: number;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedAffiliates {
  data: Affiliate[];
  meta: PaginationMeta;
}
