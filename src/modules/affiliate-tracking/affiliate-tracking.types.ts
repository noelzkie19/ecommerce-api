export type TrackingMethod = "cookie" | "url_param" | "manual";
export type ConversionValueType = "sale_amount" | "commission" | "fixed";

// ── Affiliate Tracking Link ───────────────────────────────────────────────────

export interface AffiliateTrackingLink {
  id: string;
  affiliateId: string;
  storeId: string;
  campaignName?: string;
  landingPageUrl?: string;
  clickCount: number;
  conversionCount: number;
  createdAt: string;
  expiresAt?: string;
  isActive: boolean;
  // Joined fields
  affiliate?: {
    id: string;
    name: string;
    email: string;
    pixelId?: string;
  };
}

// ── Attribution ───────────────────────────────────────────────────────────────

export interface AffiliateAttribution {
  id: string;
  orderId: string;
  affiliateId?: string;
  trackingMethod: TrackingMethod;
  pixelId?: string;
  storeId?: string;
  clickId?: string;
  referrerUrl?: string;
  createdAt: string;
  // Joined fields
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

// ── DTOs ───────────────────────────────────────────────────────────────────────

export interface CreateTrackingLinkDTO {
  affiliateId: string;
  storeId: string;
  campaignName?: string;
  landingPageUrl?: string;
  expiresAt?: string;
}

export interface UpdateTrackingLinkDTO {
  campaignName?: string;
  landingPageUrl?: string;
  expiresAt?: string;
  isActive?: boolean;
}

export interface AttributeOrderDTO {
  orderId: string;
  affiliateId: string;
  trackingMethod: TrackingMethod | "manual";
  clickId?: string;
}

export interface TrackingStats {
  affiliateId: string;
  totalClicks: number;
  totalConversions: number;
  conversionRate: number;
  totalSales: number;
  totalCommissions: number;
  recentClicks: {
    date: string;
    count: number;
  }[];
  recentConversions: {
    date: string;
    count: number;
  }[];
}

export interface AttributionData {
  affiliateId?: string;
  pixelId?: string;
  storeId?: string;
  clickId?: string;
  trackingMethod: TrackingMethod | "none";
  referrerUrl?: string;
}

// ── Paginated Types ───────────────────────────────────────────────────────────

export interface PaginatedTrackingLinks {
  data: AffiliateTrackingLink[];
  meta: import("../../common/types").PaginationMeta;
}

export interface PaginatedAttributions {
  data: AffiliateAttribution[];
  meta: import("../../common/types").PaginationMeta;
}

// ── Cookie Data ───────────────────────────────────────────────────────────────

export interface AffiliateCookieData {
  aid: string; // affiliate_id
  pid: string; // pixel_id
  sid: string; // store_id
  cid: string; // click_id
  ts: number; // timestamp
}
