import * as pixelRepository from "./affiliate-pixel.repository";
import * as affiliateRepository from "../affiliates/affiliate.repository";
import * as trackingRepository from "../affiliate-tracking/affiliate-tracking.repository";
import { AppError } from "../../common/utils/AppError";
import { buildPurchaseEvent, buildLeadEvent } from "./affiliate-pixel.utils";
import {
  MetaPixelEvent,
  PixelEventResult,
  MetaConversionsApiResponse,
  AffiliatePixelConfig,
} from "./affiliate-pixel.types";

// ── Constants ────────────────────────────────────────────────────────────────

const META_GRAPH_API_VERSION = "v18.0";
const META_CONVERSIONS_URL = `https://graph.facebook.com/${META_GRAPH_API_VERSION}`;

// ── Meta API ───────────────────────────────────────────────────────────────

/**
 * Send event to Meta Conversions API
 */
export const sendPixelEvent = async (
  event: MetaPixelEvent,
  pixelId: string,
  accessToken?: string,
): Promise<PixelEventResult> => {
  const token = accessToken || process.env.META_ACCESS_TOKEN;

  if (!token) {
    // Return a failed result instead of throwing - pixel events are optional
    return {
      success: false,
      eventId: event.eventId,
      pixelId,
      error: "Meta access token not configured",
      response: undefined,
    };
  }

  const url = `${META_CONVERSIONS_URL}/${pixelId}/events`;

  const payload = {
    data: [event],
    access_token: token,
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const jsonResult = await response.json();
    const result = jsonResult as MetaConversionsApiResponse;

    if (result.error) {
      return {
        success: false,
        eventId: event.eventId,
        pixelId,
        error: result.error.message,
        response: result,
      };
    }

    return {
      success: true,
      eventId: event.eventId,
      pixelId,
      response: result,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return {
      success: false,
      eventId: event.eventId,
      pixelId,
      error: errorMessage,
    };
  }
};

/**
 * Test pixel configuration by sending a test event
 */
export const testPixelConfig = async (
  pixelId: string,
  testEventCode?: string,
): Promise<PixelEventResult> => {
  const accessToken = process.env.META_ACCESS_TOKEN;

  if (!accessToken) {
    throw new AppError("Meta access token not configured", 500);
  }

  const url = `${META_CONVERSIONS_URL}/${pixelId}/events`;

  // Build a simple test event
  const testEvent: MetaPixelEvent = {
    eventName: "PageView",
    eventTime: Math.floor(Date.now() / 1000),
    eventId: `test_${Date.now()}`,
    userData: {},
    customData: {
      value: 0,
      currency: "PHP",
    },
    actionSource: "WEBSITE",
  };

  // Add test event code if provided
  const payload: Record<string, any> = {
    data: [testEvent],
    access_token: accessToken,
  };

  if (testEventCode) {
    payload.test_event_code = testEventCode;
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const jsonResult = await response.json();
    const result = jsonResult as MetaConversionsApiResponse;

    if (result.error) {
      return {
        success: false,
        eventId: testEvent.eventId,
        pixelId,
        error: result.error.message,
        response: result,
      };
    }

    return {
      success: true,
      eventId: testEvent.eventId,
      pixelId,
      response: result,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return {
      success: false,
      eventId: testEvent.eventId,
      pixelId,
      error: errorMessage,
    };
  }
};

// ── Purchase Event ────────────────────────────────────────────────────────

/**
 * Fire Purchase event for an affiliate sale
 */
export const firePurchaseEvent = async (
  orderId: string,
  affiliateId: string,
): Promise<PixelEventResult> => {
  // Get affiliate with pixel config
  const affiliate = await affiliateRepository.findById(affiliateId);

  if (!affiliate.pixel_id) {
    throw new AppError("Affiliate does not have a pixel ID configured", 400);
  }

  if (!affiliate.enable_purchase_event) {
    return {
      success: false,
      eventId: "",
      pixelId: affiliate.pixel_id,
      error: "Purchase events are disabled for this affiliate",
    };
  }

  // Get order details
  const { data: order } = await (
    await import("../../config/supabase")
  ).supabaseAdmin
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .single();

  if (!order) {
    throw new AppError("Order not found", 404);
  }

  // Get order items
  const { data: orderItems } = await (
    await import("../../config/supabase")
  ).supabaseAdmin
    .from("order_items")
    .select("*, product:products(id, name, price)")
    .eq("order_id", orderId);

  // Get attribution data
  const attribution = await trackingRepository.getAttributionByOrder(orderId);

  // Calculate value based on affiliate config
  let value = order.total;
  if (affiliate.conversion_value_type === "commission") {
    // Calculate commission from affiliate_sales
    const { data: sales } = await (
      await import("../../config/supabase")
    ).supabaseAdmin
      .from("affiliate_sales")
      .select("commission_earned")
      .eq("order_id", orderId)
      .eq("affiliate_id", affiliateId);

    if (sales && sales.length > 0) {
      value = sales.reduce((sum, s) => sum + (s.commission_earned || 0), 0);
    }
  } else if (
    affiliate.conversion_value_type === "fixed" &&
    affiliate.conversion_value_fixed
  ) {
    value = affiliate.conversion_value_fixed;
  }

  // Build the event
  const productItems = orderItems?.map((item: any) => ({
    productId: item.product_id,
    quantity: item.quantity,
    price: item.unit_price,
  }));

  const event = buildPurchaseEvent({
    orderId: order.id,
    value,
    currency: "PHP",
    customerEmail: order.email,
    customerPhone: order.phone_number,
    customerFirstName: order.full_name?.split(" ")[0],
    customerLastName: order.full_name?.split(" ").slice(1).join(" "),
    clientIp: undefined, // Would need to get from order or request
    userAgent: undefined,
    fbc: attribution?.click_id,
    fbp: undefined,
    productItems,
    eventSourceUrl: process.env.FRONTEND_URL || undefined,
    pixelId: affiliate.pixel_id,
    storeId: affiliate.store_id,
  });

  // Send the event
  const result = await sendPixelEvent(
    event,
    affiliate.pixel_id,
    affiliate.pixel_access_token,
  );

  // Log the event
  await pixelRepository.createPixelEvent({
    affiliateId,
    orderId,
    eventType: "Purchase",
    pixelId: affiliate.pixel_id,
    eventId: event.eventId,
    eventData: {
      value,
      currency: "PHP",
      orderId: order.id,
    },
    status: result.success ? "sent" : "failed",
    metaResponse: result.response,
  });

  return result;
};

// ── Lead Event ────────────────────────────────────────────────────────────

/**
 * Fire Lead event for an affiliate
 */
export const fireLeadEvent = async (
  orderId: string,
  affiliateId: string,
): Promise<PixelEventResult> => {
  // Get affiliate with pixel config
  const affiliate = await affiliateRepository.findById(affiliateId);

  if (!affiliate.pixel_id) {
    throw new AppError("Affiliate does not have a pixel ID configured", 400);
  }

  if (!affiliate.enable_lead_event) {
    return {
      success: false,
      eventId: "",
      pixelId: affiliate.pixel_id,
      error: "Lead events are disabled for this affiliate",
    };
  }

  // Get order details
  const { data: order } = await (
    await import("../../config/supabase")
  ).supabaseAdmin
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .single();

  if (!order) {
    throw new AppError("Order not found", 404);
  }

  // Build the event
  const event = buildLeadEvent({
    leadId: order.id,
    value: 0,
    currency: "PHP",
    customerEmail: order.email,
    customerPhone: order.phone_number,
    customerFirstName: order.full_name?.split(" ")[0],
    customerLastName: order.full_name?.split(" ").slice(1).join(" "),
    eventSourceUrl: process.env.FRONTEND_URL || undefined,
    pixelId: affiliate.pixel_id,
    storeId: affiliate.store_id,
    leadType: "affiliate_conversion",
  });

  // Send the event
  const result = await sendPixelEvent(
    event,
    affiliate.pixel_id,
    affiliate.pixel_access_token,
  );

  // Log the event
  await pixelRepository.createPixelEvent({
    affiliateId,
    orderId,
    eventType: "Lead",
    pixelId: affiliate.pixel_id,
    eventId: event.eventId,
    eventData: {
      orderId: order.id,
    },
    status: result.success ? "sent" : "failed",
    metaResponse: result.response,
  });

  return result;
};

// ── Event Management ───────────────────────────────────────────────────

export const getPixelEvents = (
  affiliateId: string,
  page: number = 1,
  limit: number = 20,
) => pixelRepository.getPixelEventsByAffiliate(affiliateId, page, limit);

export const retryFailedEvents = async (limit: number = 10) => {
  const failedEvents = await pixelRepository.getFailedEvents(limit);

  for (const event of failedEvents) {
    const eventData = JSON.parse(event.event_data || "{}");

    const result = await sendPixelEvent(
      eventData as MetaPixelEvent,
      event.pixel_id,
    );

    await pixelRepository.updatePixelEventStatus(
      event.id,
      result.success ? "sent" : "failed",
      result.response,
      result.success ? event.retry_count + 1 : event.retry_count,
    );
  }
};

// ── Pixel Configuration ────────────────────────────────────────────────

export const getAffiliatePixelConfig = async (affiliateId: string) => {
  const affiliate = await affiliateRepository.findById(affiliateId);

  return {
    affiliateId: affiliate.id,
    pixelId: affiliate.pixel_id || "",
    pixelAccessToken: affiliate.pixel_access_token,
    enablePurchaseEvent: affiliate.enable_purchase_event,
    enableLeadEvent: affiliate.enable_lead_event,
    conversionValueType: affiliate.conversion_value_type || "sale_amount",
    conversionValueFixed: affiliate.conversion_value_fixed,
  } as AffiliatePixelConfig;
};

export const updateAffiliatePixelConfig = async (
  affiliateId: string,
  config: Partial<AffiliatePixelConfig>,
) => {
  const updates: Record<string, any> = {};

  if (config.pixelId !== undefined) updates.pixel_id = config.pixelId;
  if (config.pixelAccessToken !== undefined)
    updates.pixel_access_token = config.pixelAccessToken;
  if (config.enablePurchaseEvent !== undefined)
    updates.enable_purchase_event = config.enablePurchaseEvent;
  if (config.enableLeadEvent !== undefined)
    updates.enable_lead_event = config.enableLeadEvent;
  if (config.conversionValueType !== undefined)
    updates.conversion_value_type = config.conversionValueType;
  if (config.conversionValueFixed !== undefined)
    updates.conversion_value_fixed = config.conversionValueFixed;

  const { error } = await (await import("../../config/supabase")).supabaseAdmin
    .from("affiliates")
    .update(updates)
    .eq("id", affiliateId);

  if (error) throw new AppError(error.message, 500);

  return getAffiliatePixelConfig(affiliateId);
};
