export type MetaEventType =
  | "Purchase"
  | "Lead"
  | "ViewContent"
  | "AddToCart"
  | "CompleteRegistration"
  | "PageView";
export type PixelEventStatus = "pending" | "sent" | "failed";

// ── Meta Pixel Event ───────────────────────────────────────────────────────

export interface MetaUserData {
  em?: string[]; // Email (hashed)
  ph?: string[]; // Phone (hashed)
  fn?: string[]; // First name (hashed)
  ln?: string[]; // Last name (hashed)
  ct?: string[]; // City (hashed)
  st?: string[]; // State (hashed)
  zp?: string[]; // Zip code (hashed)
  country?: string[]; // Country (hashed)
  client_ip_address?: string;
  client_user_agent?: string;
  fbc?: string; // Facebook Click ID
  fbp?: string; // Facebook Browser ID
}

export interface MetaCustomData {
  value: number;
  currency: string;
  content_ids?: string[];
  content_type?: string;
  contents?: Array<{
    id: string;
    quantity: number;
    item_price?: number;
  }>;
  order_id?: string;
  pixelId?: string;
  storeId?: string;
  lead_type?: string;
}

export interface MetaPixelEvent {
  eventName: MetaEventType;
  eventTime: number;
  eventId: string;
  userData: MetaUserData;
  customData: MetaCustomData;
  eventSourceUrl?: string;
  actionSource: "WEBSITE" | "APP" | "EMAIL" | "PHONE" | "SYSTEM" | "OTHER";
}

export interface MetaEventResponse {
  events_received: number;
  fbtrace_id: string;
  id: string;
}

export interface MetaConversionsApiResponse {
  events?: MetaEventResponse[];
  error?: {
    message: string;
    type: string;
    code: number;
    fbtrace_id?: string;
  };
}

// ── Pixel Configuration ───────────────────────────────────────────────────

export type ConversionValueType = "sale_amount" | "commission" | "fixed";

export interface PixelConfig {
  pixelId: string;
  accessToken?: string;
  enablePurchase: boolean;
  enableLead: boolean;
  conversionValueType: ConversionValueType;
  fixedValue?: number;
}

export interface AffiliatePixelConfig {
  affiliateId: string;
  pixelId: string;
  pixelAccessToken?: string;
  enablePurchaseEvent: boolean;
  enableLeadEvent: boolean;
  conversionValueType: ConversionValueType;
  conversionValueFixed?: number;
}

// ── Pixel Event Record ─────────────────────────────────────────────────────

export interface AffiliatePixelEvent {
  id: string;
  affiliateId?: string;
  orderId?: string;
  eventType: MetaEventType;
  pixelId: string;
  eventId: string;
  eventData?: Record<string, any>;
  status: PixelEventStatus;
  metaResponse?: Record<string, any>;
  retryCount: number;
  createdAt: string;
  sentAt?: string;
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

// ── Paginated Types ───────────────────────────────────────────────────────

export interface PaginatedPixelEvents {
  data: AffiliatePixelEvent[];
  meta: import("../../common/types").PaginationMeta;
}
