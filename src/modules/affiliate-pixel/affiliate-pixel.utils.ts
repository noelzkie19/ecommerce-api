import * as crypto from "node:crypto";
import {
  MetaPixelEvent,
  MetaUserData,
  MetaCustomData,
} from "./affiliate-pixel.types";

// ── Hashing Functions ───────────────────────────────────────────────────────

/**
 * Hash data using SHA-256 (required by Meta)
 */
export const hashData = (data: string): string => {
  return crypto
    .createHash("sha256")
    .update(data.toLowerCase().trim())
    .digest("hex");
};

/**
 * Hash email for Meta
 */
export const hashEmail = (email: string): string => {
  return hashData(email);
};

/**
 * Hash phone number for Meta
 */
export const hashPhone = (phone: string): string => {
  // Remove all non-digit characters
  const cleaned = phone.replaceAll(String.raw`\D`, "");
  return hashData(cleaned);
};

// ── User Data Builders ─────────────────────────────────────────────────────

/**
 * Build user data object from customer info
 */
export const buildUserData = (params: {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  clientIp?: string;
  userAgent?: string;
  fbc?: string; // Facebook Click ID from cookie _fbc
  fbp?: string; // Facebook Browser ID from cookie _fbp
}): MetaUserData => {
  const userData: MetaUserData = {};

  if (params.email) {
    userData.em = [hashEmail(params.email)];
  }

  if (params.phone) {
    userData.ph = [hashPhone(params.phone)];
  }

  if (params.firstName) {
    userData.fn = [hashData(params.firstName)];
  }

  if (params.lastName) {
    userData.ln = [hashData(params.lastName)];
  }

  if (params.city) {
    userData.ct = [hashData(params.city)];
  }

  if (params.state) {
    userData.st = [hashData(params.state)];
  }

  if (params.zipCode) {
    userData.zp = [hashData(params.zipCode)];
  }

  if (params.country) {
    userData.country = [hashData(params.country)];
  }

  if (params.clientIp) {
    userData.client_ip_address = params.clientIp;
  }

  if (params.userAgent) {
    userData.client_user_agent = params.userAgent;
  }

  if (params.fbc) {
    userData.fbc = params.fbc;
  }

  if (params.fbp) {
    userData.fbp = params.fbp;
  }

  return userData;
};

// ── Event Builders ────────────────────────────────────────────────────────

/**
 * Generate unique event ID
 */
export const generateEventId = (orderId: string, eventType: string): string => {
  return `${eventType}_${orderId}_${Date.now()}`;
};

/**
 * Build Purchase event
 */
export const buildPurchaseEvent = (params: {
  orderId: string;
  value: number;
  currency: string;
  customerEmail?: string;
  customerPhone?: string;
  customerFirstName?: string;
  customerLastName?: string;
  customerCity?: string;
  customerState?: string;
  customerZipCode?: string;
  customerCountry?: string;
  clientIp?: string;
  userAgent?: string;
  fbc?: string;
  fbp?: string;
  productItems?: Array<{
    productId: string;
    quantity: number;
    price: number;
  }>;
  eventSourceUrl?: string;
  pixelId?: string;
  storeId?: string;
}): MetaPixelEvent => {
  const eventId = generateEventId(params.orderId, "Purchase");

  const contents = params.productItems?.map((item) => ({
    id: item.productId,
    quantity: item.quantity,
    item_price: item.price,
  }));

  const customData: MetaCustomData = {
    value: params.value,
    currency: params.currency,
    order_id: params.orderId,
    pixelId: params.pixelId,
    storeId: params.storeId,
  };

  if (contents && contents.length > 0) {
    customData.contents = contents;
    customData.content_type = "product";
    customData.content_ids = contents.map((c) => c.id);
  }

  return {
    eventName: "Purchase",
    eventTime: Math.floor(Date.now() / 1000),
    eventId,
    userData: buildUserData({
      email: params.customerEmail,
      phone: params.customerPhone,
      firstName: params.customerFirstName,
      lastName: params.customerLastName,
      city: params.customerCity,
      state: params.customerState,
      zipCode: params.customerZipCode,
      country: params.customerCountry,
      clientIp: params.clientIp,
      userAgent: params.userAgent,
      fbc: params.fbc,
      fbp: params.fbp,
    }),
    customData,
    eventSourceUrl: params.eventSourceUrl,
    actionSource: "WEBSITE",
  };
};

/**
 * Build Lead event
 */
export const buildLeadEvent = (params: {
  leadId: string;
  value?: number;
  currency?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerFirstName?: string;
  customerLastName?: string;
  clientIp?: string;
  userAgent?: string;
  fbc?: string;
  fbp?: string;
  eventSourceUrl?: string;
  pixelId?: string;
  storeId?: string;
  leadType?: string;
}): MetaPixelEvent => {
  const eventId = generateEventId(params.leadId, "Lead");

  const customData: MetaCustomData = {
    value: params.value || 0,
    currency: params.currency || "PHP",
    pixelId: params.pixelId,
    storeId: params.storeId,
    lead_type: params.leadType || "affiliate_signup",
  };

  return {
    eventName: "Lead",
    eventTime: Math.floor(Date.now() / 1000),
    eventId,
    userData: buildUserData({
      email: params.customerEmail,
      phone: params.customerPhone,
      firstName: params.customerFirstName,
      lastName: params.customerLastName,
      clientIp: params.clientIp,
      userAgent: params.userAgent,
      fbc: params.fbc,
      fbp: params.fbp,
    }),
    customData,
    eventSourceUrl: params.eventSourceUrl,
    actionSource: "WEBSITE",
  };
};

/**
 * Build ViewContent event
 */
export const buildViewContentEvent = (params: {
  productId: string;
  value: number;
  currency: string;
  customerEmail?: string;
  clientIp?: string;
  userAgent?: string;
  fbc?: string;
  fbp?: string;
  eventSourceUrl?: string;
}): MetaPixelEvent => {
  const eventId = generateEventId(params.productId, "ViewContent");

  return {
    eventName: "ViewContent",
    eventTime: Math.floor(Date.now() / 1000),
    eventId,
    userData: buildUserData({
      email: params.customerEmail,
      clientIp: params.clientIp,
      userAgent: params.userAgent,
      fbc: params.fbc,
      fbp: params.fbp,
    }),
    customData: {
      value: params.value,
      currency: params.currency,
      content_ids: [params.productId],
      content_type: "product",
    },
    eventSourceUrl: params.eventSourceUrl,
    actionSource: "WEBSITE",
  };
};

/**
 * Build AddToCart event
 */
export const buildAddToCartEvent = (params: {
  productId: string;
  value: number;
  currency: string;
  quantity: number;
  customerEmail?: string;
  clientIp?: string;
  userAgent?: string;
  fbc?: string;
  fbp?: string;
  eventSourceUrl?: string;
}): MetaPixelEvent => {
  const eventId = generateEventId(params.productId, "AddToCart");

  return {
    eventName: "AddToCart",
    eventTime: Math.floor(Date.now() / 1000),
    eventId,
    userData: buildUserData({
      email: params.customerEmail,
      clientIp: params.clientIp,
      userAgent: params.userAgent,
      fbc: params.fbc,
      fbp: params.fbp,
    }),
    customData: {
      value: params.value,
      currency: params.currency,
      content_ids: [params.productId],
      content_type: "product",
      contents: [
        {
          id: params.productId,
          quantity: params.quantity,
        },
      ],
    },
    eventSourceUrl: params.eventSourceUrl,
    actionSource: "WEBSITE",
  };
};

// ── Cookie Parsing ────────────────────────────────────────────────────────

/**
 * Extract Facebook Click ID from _fbc cookie
 */
export const extractFbc = (
  fbcCookie: string | undefined,
): string | undefined => {
  if (!fbcCookie) return undefined;
  // _fbc cookie format: fb.1.1699999999.abc123def
  return fbcCookie;
};

/**
 * Extract Facebook Browser ID from _fbp cookie
 */
export const extractFbp = (
  fbpCookie: string | undefined,
): string | undefined => {
  if (!fbpCookie) return undefined;
  // _fbp cookie format: fb.1.1699999999.abc123def
  return fbpCookie;
};

/**
 * Parse FBC and FBP from cookies
 */
export const parseFacebookCookies = (cookies: Record<string, string>) => {
  return {
    fbc: extractFbc(cookies._fbc),
    fbp: extractFbp(cookies._fbp),
  };
};
