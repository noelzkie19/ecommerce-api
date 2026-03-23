import { resolve } from "../../../di/container";
import { IAffiliateRepository } from "../../../domain/interfaces/IAffiliateRepository";
import { IAffiliatePixelRepository } from "../../../domain/interfaces/IAffiliatePixelRepository";
import {
  buildLeadEvent,
  sendPixelEvent,
  SendPixelEventResult,
} from "../../../modules/affiliate-pixel/affiliate-pixel.utils";
import { AppError } from "../../../common/utils/AppError";
import { supabaseAdmin } from "../../../config/supabase";

export interface FireLeadEventInput {
  orderId: string;
  affiliateId: string;
}

export const fireLeadEvent = async (
  input: FireLeadEventInput,
): Promise<SendPixelEventResult> => {
  // Resolve repositories from DI container
  const affiliateRepository = resolve<IAffiliateRepository>(
    "IAffiliateRepository",
  );
  const pixelRepository = resolve<IAffiliatePixelRepository>(
    "IAffiliatePixelRepository",
  );

  // Get affiliate with pixel config
  const affiliate = await affiliateRepository.findById(input.affiliateId);

  if (!affiliate) {
    throw new AppError("Affiliate not found", 404);
  }

  if (!affiliate.pixelId) {
    throw new AppError("Affiliate does not have a pixel ID configured", 400);
  }

  if (!affiliate.enableLeadEvent) {
    return {
      success: false,
      eventId: "",
      pixelId: affiliate.pixelId,
      error: "Lead events are disabled for this affiliate",
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
    pixelId: affiliate.pixelId,
    storeId: affiliate.storeId || undefined,
    leadType: "affiliate_conversion",
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
    eventType: "Lead",
    pixelId: affiliate.pixelId,
    eventId: event.eventId,
    eventData: {
      orderId: order.id,
    },
    status: result.success ? "sent" : "failed",
    metaResponse: result.response,
  });

  return result;
};
