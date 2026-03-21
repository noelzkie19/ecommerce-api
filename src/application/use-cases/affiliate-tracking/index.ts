// Shared Types
export type TrackingMethod = "cookie" | "url_param" | "manual";
export type ConversionValueType = "sale_amount" | "commission" | "fixed";

// Affiliate Tracking Link
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
  affiliate?: {
    id: string;
    name: string;
    email: string;
    pixelId?: string;
  };
}

// Attribution
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

// DTOs
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

// Stats
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

// Cookie Data
export interface AffiliateCookieData {
  aid: string;
  pid: string;
  sid: string;
  cid: string;
  ts: number;
}

// Pagination
export interface PaginatedTrackingLinks<T = AffiliateTrackingLink> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface PaginatedAttributions<T = AffiliateAttribution> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export { generateTrackingLink } from "./GenerateTrackingLink";
export { getTrackingLinks } from "./GetTrackingLinks";
export { getTrackingLink } from "./GetTrackingLink";
export { updateTrackingLink } from "./UpdateTrackingLink";
export { deleteTrackingLink } from "./DeleteTrackingLink";
export { getAttributionByOrder } from "./GetAttributionByOrder";
export { attributeOrder } from "./AttributeOrder";
export { getAttributions } from "./GetAttributions";
export { getTrackingStats } from "./GetTrackingStats";
export { resolveRef } from "./ResolveRef";
export { attributeOrderFromData } from "./AttributeOrderFromData";

// Types
export type {
  GenerateTrackingLinkInput,
  GenerateTrackingLinkOutput,
} from "./GenerateTrackingLink";
export type {
  GetTrackingLinksInput,
  GetTrackingLinksOutput,
  TrackingLinkData,
} from "./GetTrackingLinks";
export type {
  GetTrackingLinkInput,
  TrackingLinkData as SingleTrackingLinkData,
} from "./GetTrackingLink";
export type {
  UpdateTrackingLinkInput,
  TrackingLinkData as UpdatedTrackingLinkData,
} from "./UpdateTrackingLink";
export type { DeleteTrackingLinkInput } from "./DeleteTrackingLink";
export type {
  GetAttributionByOrderInput,
  AttributionData,
} from "./GetAttributionByOrder";
export type {
  AttributeOrderInput,
  AttributionData as AttributeOrderOutput,
} from "./AttributeOrder";
export type {
  GetAttributionsInput,
  GetAttributionsOutput,
  AttributionData as AttributionListData,
} from "./GetAttributions";
export type {
  GetTrackingStatsInput,
  TrackingStatsOutput,
} from "./GetTrackingStats";
export type { ResolveRefInput, ResolveRefOutput } from "./ResolveRef";
export type {
  AttributeOrderFromDataInput,
  AttributionData as AttributionFromDataOutput,
} from "./AttributeOrderFromData";
