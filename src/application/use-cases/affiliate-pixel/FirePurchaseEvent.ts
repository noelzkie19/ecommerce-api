import * as affiliateRepository from "../../../modules/affiliates/affiliate.repository";
import * as trackingRepository from "../../../modules/affiliate-tracking/affiliate-tracking.repository";
import * as pixelRepository from "../../../modules/affiliate-pixel/affiliate-pixel.repository";
import {
  buildPurchaseEvent,
  sendPixelEvent,
  SendPixelEventResult,
} from "../../../modules/affiliate-pixel/affiliate-pixel.utils";
import { AppError } from "../../../common/utils/AppError";
import { supabaseAdmin } from "../../../config/supabase";

export interface FirePurchaseEventInput {
  orderId: string;
  affiliateId: string;
}

export const firePurchaseEvent = async (
  input: FirePurchaseEventInput,
): Promise<SendPixelEventResult> => {
  // Get affiliate with pixel config
  const affiliate = await affiliateRepository.findById(input.affiliateId);

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
  const { data: order } = await supabaseAdmin
    .from("orders")
    .select("*")
    .eq("id", input.orderId)
    .single();

  if (!order) {
    throw new AppError("Order not found", 404);
  }

  // Get order items
  const { data: orderItems } = await supabaseAdmin
    .from("order_items")
    .select("*, product:products(id, name, price)")
    .eq("order_id", input.orderId);

  // Get attribution data
  const attribution = await trackingRepository.getAttributionByOrder(
    input.orderId,
  );

  // Calculate value based on affiliate config
  let value = order.total;
  if (affiliate.conversion_value_type === "commission") {
    // Calculate commission from affiliate_sales
    const { data: sales } = await supabaseAdmin
      .from("affiliate_sales")
      .select("commission_earned")
      .eq("order_id", input.orderId)
      .eq("affiliate_id", input.affiliateId);

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
    clientIp: undefined,
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
    affiliateId: input.affiliateId,
    orderId: input.orderId,
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
