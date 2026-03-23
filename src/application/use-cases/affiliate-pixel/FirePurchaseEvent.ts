import { resolve } from "../../../di/container";
import { IAffiliateRepository } from "../../../domain/interfaces/IAffiliateRepository";
import { IAffiliatePixelRepository } from "../../../domain/interfaces/IAffiliatePixelRepository";
import { IAffiliateTrackingRepository } from "../../../domain/interfaces/IAffiliateTrackingRepository";
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
  // Resolve repositories from DI container
  const affiliateRepository = resolve<IAffiliateRepository>(
    "IAffiliateRepository",
  );
  const pixelRepository = resolve<IAffiliatePixelRepository>(
    "IAffiliatePixelRepository",
  );
  const trackingRepository = resolve<IAffiliateTrackingRepository>(
    "IAffiliateTrackingRepository",
  );

  // Get affiliate with pixel config
  const affiliate = await affiliateRepository.findById(input.affiliateId);

  if (!affiliate) {
    throw new AppError("Affiliate not found", 404);
  }

  if (!affiliate.pixelId) {
    throw new AppError("Affiliate does not have a pixel ID configured", 400);
  }

  if (!affiliate.enablePurchaseEvent) {
    return {
      success: false,
      eventId: "",
      pixelId: affiliate.pixelId,
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
  if (affiliate.conversionValueType === "commission") {
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
    affiliate.conversionValueType === "fixed" &&
    affiliate.conversionValueFixed
  ) {
    value = affiliate.conversionValueFixed;
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
    fbc: (attribution as any)?.click_id || undefined,
    fbp: undefined,
    productItems,
    eventSourceUrl: process.env.FRONTEND_URL || undefined,
    pixelId: affiliate.pixelId,
    storeId: affiliate.storeId || undefined,
  });

  // Send the event
  const result = await sendPixelEvent(
    event,
    affiliate.pixelId,
    affiliate.pixelAccessToken || undefined,
  );

  // Log the event
  await pixelRepository.createPixelEvent({
    affiliateId: input.affiliateId,
    orderId: input.orderId,
    eventType: "Purchase",
    pixelId: affiliate.pixelId,
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
