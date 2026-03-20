import * as affiliateRepository from "../../../modules/affiliates/affiliate.repository";
import * as pixelRepository from "../../../modules/affiliate-pixel/affiliate-pixel.repository";
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
  // Get affiliate with pixel config
  const affiliate = await affiliateRepository.findById(input.affiliateId);

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
    affiliateId: input.affiliateId,
    orderId: input.orderId,
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
