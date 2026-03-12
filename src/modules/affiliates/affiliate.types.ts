export type AffiliateStatus = "active" | "suspended";
export type CommissionType = "percentage" | "fixed";

// ── Affiliate ─────────────────────────────────────────────────────────────────

export interface Affiliate {
  id: string;
  name: string;
  email: string;
  status: AffiliateStatus;
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

export interface CreateAffiliateDTO {
  name: string;
  email: string;
}

export interface UpdateAffiliateDTO {
  name?: string;
  email?: string;
  status?: AffiliateStatus;
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
