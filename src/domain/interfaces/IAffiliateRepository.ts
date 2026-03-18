/**
 * IAffiliateRepository Interface
 *
 * Defines the contract for affiliate data access.
 * This interface is part of the domain layer and should be implemented
 * by the infrastructure layer (e.g., Supabase implementation).
 */

import {
  Affiliate,
  AffiliateStatus,
  CreateAffiliateProps,
} from "../entities/Affiliate";

/**
 * Pagination result
 */
export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * Affiliate repository interface
 * Defines all data access operations for affiliates
 */
export interface IAffiliateRepository {
  /**
   * Find all affiliates with pagination
   */
  findAllPaginated(
    page: number,
    limit: number,
    search?: string,
    status?: AffiliateStatus,
  ): Promise<PaginatedResult<Affiliate>>;

  /**
   * Find affiliate by ID
   */
  findById(id: string): Promise<Affiliate | null>;

  /**
   * Find affiliate by user ID
   */
  findByUserId(userId: string): Promise<Affiliate | null>;

  /**
   * Find affiliate by email
   */
  findByEmail(email: string): Promise<Affiliate | null>;

  /**
   * Find affiliate by affiliate link
   */
  findByAffiliateLink(link: string): Promise<Affiliate | null>;

  /**
   * Find affiliate by store ID
   */
  findByStoreId(storeId: string): Promise<Affiliate | null>;

  /**
   * Create a new affiliate
   */
  create(props: CreateAffiliateProps): Promise<Affiliate>;

  /**
   * Update an affiliate
   */
  update(id: string, data: Partial<CreateAffiliateProps>): Promise<Affiliate>;

  /**
   * Delete an affiliate
   */
  delete(id: string): Promise<void>;

  /**
   * Activate affiliate by user ID
   */
  activateByUserId(userId: string): Promise<void>;

  /**
   * Mark affiliate as paid by user ID
   */
  markAsPaidByUserId(userId: string): Promise<void>;

  /**
   * Generate and set affiliate link
   */
  generateAndSetAffiliateLink(userId: string): Promise<string | null>;

  /**
   * Update pixel ID by user ID
   */
  updatePixelByUserId(userId: string, pixelId: string): Promise<Affiliate>;

  /**
   * Update referred by
   */
  updateReferredBy(affiliateId: string, referrerId: string): Promise<void>;

  /**
   * Update affiliate totals (sales and commissions)
   */
  updateTotals(
    affiliateId: string,
    saleAmount: number,
    commissionEarned: number,
  ): Promise<void>;

  /**
   * Find products by affiliate
   */
  findProductsByAffiliate(affiliateId: string): Promise<AffiliateProduct[]>;

  /**
   * Assign product to affiliate
   */
  assignProduct(
    affiliateId: string,
    productId: string,
    commissionType: "percentage" | "fixed",
    commissionValue: number,
  ): Promise<AffiliateProduct>;

  /**
   * Remove product from affiliate
   */
  removeProduct(affiliateId: string, productId: string): Promise<void>;

  /**
   * Get affiliate settings
   */
  getSettings(): Promise<AffiliateSettings>;

  /**
   * Update affiliate settings
   */
  updateSettings(
    settings: Partial<AffiliateSettings>,
  ): Promise<AffiliateSettings>;
}

/**
 * Affiliate product (product assigned to affiliate with commission)
 */
export interface AffiliateProduct {
  id: string;
  affiliateId: string;
  productId: string;
  commissionType: "percentage" | "fixed";
  commissionValue: number;
  product?: {
    id: string;
    name: string;
    price: number;
    imageUrl: string | null;
  };
}

/**
 * Affiliate settings
 */
export interface AffiliateSettings {
  registrationFee: number;
  referralCommissionRate: number;
  referralCommissionType: "percentage" | "fixed";
}
