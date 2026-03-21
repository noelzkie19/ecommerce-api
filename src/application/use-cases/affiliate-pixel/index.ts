// Shared Types
export type MetaEventType =
  | "Purchase"
  | "Lead"
  | "ViewContent"
  | "AddToCart"
  | "CompleteRegistration"
  | "PageView";
export type PixelEventStatus = "pending" | "sent" | "failed";
export type ConversionValueType = "sale_amount" | "commission" | "fixed";

// Meta User Data
export interface MetaUserData {
  em?: string[];
  ph?: string[];
  fn?: string[];
  ln?: string[];
  ct?: string[];
  st?: string[];
  zp?: string[];
  country?: string[];
  client_ip_address?: string;
  client_user_agent?: string;
  fbc?: string;
  fbp?: string;
}

// Meta Custom Data
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

// Meta Pixel Event
export interface MetaPixelEvent {
  eventName: MetaEventType;
  eventTime: number;
  eventId: string;
  userData: MetaUserData;
  customData: MetaCustomData;
  eventSourceUrl?: string;
  actionSource: "WEBSITE" | "APP" | "EMAIL" | "PHONE" | "SYSTEM" | "OTHER";
}

// Meta Event Response
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

// Pixel Configuration
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

// Pixel Event Record
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

// Pagination
export interface PaginatedPixelEvents {
  data: AffiliatePixelEvent[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export { getAffiliatePixelConfig } from "./GetAffiliatePixelConfig";
export { updateAffiliatePixelConfig } from "./UpdateAffiliatePixelConfig";
export { testPixelConfig } from "./TestPixelConfig";
export { getPixelEvents } from "./GetPixelEvents";
export { firePurchaseEvent } from "./FirePurchaseEvent";
export { fireLeadEvent } from "./FireLeadEvent";
export { retryFailedEvents } from "./RetryFailedEvents";

// Re-export from utils for convenience
export type { SendPixelEventResult } from "../../../modules/affiliate-pixel/affiliate-pixel.utils";

// Types
export type {
  GetAffiliatePixelConfigInput,
  AffiliatePixelConfigOutput,
} from "./GetAffiliatePixelConfig";
export type {
  UpdateAffiliatePixelConfigInput,
  UpdateAffiliatePixelConfigOutput,
} from "./UpdateAffiliatePixelConfig";
export type {
  TestPixelConfigInput,
  PixelEventResult as TestPixelConfigResult,
} from "./TestPixelConfig";
export type {
  GetPixelEventsInput,
  GetPixelEventsOutput,
  PixelEventData,
} from "./GetPixelEvents";
export type { FirePurchaseEventInput } from "./FirePurchaseEvent";
export type { FireLeadEventInput } from "./FireLeadEvent";
export type {
  RetryFailedEventsInput,
  RetryFailedEventsOutput,
} from "./RetryFailedEvents";
