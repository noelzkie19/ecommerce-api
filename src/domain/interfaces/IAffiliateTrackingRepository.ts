/**
 * IAffiliateTrackingRepository Interface
 *
 * Defines the contract for affiliate tracking and attribution data access.
 * This interface is part of the domain layer and should be implemented
 * by the infrastructure layer (e.g., Supabase implementation).
 */

import {
  CreateTrackingLinkDTO,
  UpdateTrackingLinkDTO,
  TrackingMethod,
} from "../../application/use-cases/affiliate-tracking";

/**
 * Tracking link with affiliate info
 */
export interface TrackingLinkWithAffiliate {
  id: string;
  affiliate_id: string;
  store_id: string;
  campaign_name: string | null;
  landing_page_url: string | null;
  click_count: number;
  conversion_count: number;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
  affiliate?: {
    id: string;
    name: string;
    email: string;
    pixel_id: string | null;
  };
}

/**
 * Attribution record
 */
export interface AttributionRecord {
  id: string;
  order_id: string;
  affiliate_id: string | null;
  tracking_method: TrackingMethod;
  pixel_id: string | null;
  store_id: string | null;
  click_id: string | null;
  referrer_url: string | null;
  created_at: string;
  affiliate?: {
    id: string;
    name: string;
    email: string;
  };
  order?: {
    id: string;
    total: number;
    status: string;
  };
}

/**
 * Tracking statistics
 */
export interface TrackingStats {
  affiliateId: string;
  totalClicks: number;
  totalConversions: number;
  conversionRate: number;
  totalSales: number;
  totalCommissions: number;
  recentClicks: { date: string; count: number }[];
  recentConversions: { date: string; count: number }[];
}

/**
 * Paginated tracking links
 */
export interface PaginatedTrackingLinks {
  data: TrackingLinkWithAffiliate[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * Paginated attributions
 */
export interface PaginatedAttributions {
  data: AttributionRecord[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * Affiliate tracking repository interface
 * Defines all data access operations for tracking and attribution
 */
export interface IAffiliateTrackingRepository {
  /**
   * Create a tracking link
   */
  createTrackingLink(
    dto: CreateTrackingLinkDTO,
  ): Promise<TrackingLinkWithAffiliate>;

  /**
   * Get a tracking link by ID
   */
  getTrackingLink(id: string): Promise<TrackingLinkWithAffiliate | null>;

  /**
   * Get tracking link by affiliate and store
   */
  getTrackingLinkByAffiliate(
    affiliateId: string,
    storeId: string,
    campaignName?: string,
  ): Promise<TrackingLinkWithAffiliate | null>;

  /**
   * Get tracking links by affiliate
   */
  getTrackingLinksByAffiliate(
    affiliateId: string,
    page: number,
    limit: number,
  ): Promise<PaginatedTrackingLinks>;

  /**
   * Update a tracking link
   */
  updateTrackingLink(
    id: string,
    dto: UpdateTrackingLinkDTO,
  ): Promise<TrackingLinkWithAffiliate>;

  /**
   * Delete a tracking link
   */
  deleteTrackingLink(id: string): Promise<void>;

  /**
   * Record a click
   */
  recordClick(
    affiliateId: string,
    storeId: string,
    referrerUrl?: string,
  ): Promise<{
    clickId: string;
    affiliateId: string;
    storeId: string;
    trackingLink: TrackingLinkWithAffiliate;
  }>;

  /**
   * Create an attribution record
   */
  createAttribution(dto: {
    orderId: string;
    affiliateId?: string;
    trackingMethod: TrackingMethod;
    pixelId?: string;
    storeId?: string;
    clickId?: string;
    referrerUrl?: string;
  }): Promise<AttributionRecord>;

  /**
   * Get attribution by order ID
   */
  getAttributionByOrder(orderId: string): Promise<AttributionRecord | null>;

  /**
   * Get attributions by affiliate
   */
  getAttributionsByAffiliate(
    affiliateId: string,
    page: number,
    limit: number,
  ): Promise<PaginatedAttributions>;

  /**
   * Attribute order to affiliate
   */
  attributeOrderToAffiliate(dto: {
    orderId: string;
    affiliateId: string;
    trackingMethod: TrackingMethod;
    clickId?: string;
  }): Promise<AttributionRecord>;

  /**
   * Get tracking statistics
   */
  getTrackingStats(
    affiliateId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<TrackingStats>;

  /**
   * Increment conversion count
   */
  incrementConversionCount(affiliateId: string, storeId: string): Promise<void>;
}
