/**
 * Fire AddToCart Event Use Case
 *
 * Automatically fires an AddToCart pixel event when a customer adds a product
 * to their cart via an affiliate link.
 */

import { resolve } from "../../../di/container";
import { IAffiliateRepository } from "../../../domain/interfaces/IAffiliateRepository";
import { IAffiliatePixelRepository } from "../../../domain/interfaces/IAffiliatePixelRepository";
import {
  buildAddToCartEvent,
  sendPixelEvent,
  SendPixelEventResult,
} from "../../../modules/affiliate-pixel/affiliate-pixel.utils";
import { AppError } from "../../../common/utils/AppError";
import { supabaseAdmin } from "../../../config/supabase";

export interface FireAddToCartEventInput {
  productId: string;
  value: number;
  affiliateId: string;
  quantity: number;
  currency?: string;
}

export const fireAddToCartEvent = async (
  input: FireAddToCartEventInput,
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
    // Silently return success if no pixel configured - don't block the customer
    return {
      success: true,
      eventId: "",
      pixelId: "",
      error: "No pixel ID configured for this affiliate",
    };
  }

  // Get product details
  const { data: product } = await supabaseAdmin
    .from("products")
    .select("id, name, price")
    .eq("id", input.productId)
    .single();

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  // Build the event
  const event = buildAddToCartEvent({
    productId: product.id,
    value: input.value || product.price,
    currency: input.currency || "PHP",
    quantity: input.quantity || 1,
    customerEmail: undefined, // Not available at this point
    clientIp: undefined,
    userAgent: undefined,
    fbc: undefined,
    fbp: undefined,
    eventSourceUrl: process.env.FRONTEND_URL || undefined,
  });

  // Send the event
  const result = await sendPixelEvent(
    event,
    affiliate.pixelId,
    affiliate.pixelAccessToken || undefined,
  );

  // Log the event (non-blocking)
  try {
    await pixelRepository.createPixelEvent({
      affiliateId: input.affiliateId,
      orderId: undefined, // No order at this stage
      eventType: "AddToCart",
      pixelId: affiliate.pixelId,
      eventId: event.eventId,
      eventData: {
        productId: product.id,
        value: input.value || product.price,
        quantity: input.quantity || 1,
        currency: input.currency || "PHP",
      },
      status: result.success ? "sent" : "failed",
      metaResponse: result.response,
    });
  } catch (logError) {
    // Non-blocking - don't fail the request if logging fails
    console.error("[Pixel] Failed to log AddToCart event:", logError);
  }

  return result;
};
