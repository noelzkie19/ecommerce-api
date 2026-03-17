import * as orderRepository from "./order.repository";
import * as cartRepository from "../cart/cart.repository";
import * as cartService from "../cart/cart.service";
import * as paymongoUtils from "../../utils/paymongo.utils";
import { CartOwner } from "../cart/cart.types";
import { CreateOrderDTO, OrderStatus, PlaceOrderResult } from "./order.types";
import { AppError } from "../../common/utils/AppError";
import * as affiliateSalesService from "../affiliates-sales/affiliate-sales.service";
import {
  activateAffiliateByUserId,
  markAffiliateAsPaidByUserId,
} from "../affiliates/affiliate.service";
import * as trackingService from "../affiliate-tracking/affiliate-tracking.service";
import * as pixelService from "../affiliate-pixel/affiliate-pixel.service";
import { supabaseAdmin } from "../../config/supabase";

// ── Place Order ───────────────────────────────────────────────────────────────

export const placeOrder = async (
  owner: CartOwner,
  dto: CreateOrderDTO,
  attributionData?: {
    affiliateId?: string;
    pixelId?: string;
    storeId?: string;
    clickId?: string;
    trackingMethod?: string;
  },
): Promise<PlaceOrderResult> => {
  const cartItems = await cartRepository.findAllByOwner(owner);
  if (!cartItems || cartItems.length === 0) {
    throw new AppError("Cart is empty", 400);
  }

  let paymentIntentId: string | undefined;
  let mayaRedirectUrl: string | null = null;

  if (dto.paymentMethod === "gcash") {
    // ── Maya Wallet: create & attach PayMongo intent ────────────────────────────
    // Stock is NOT deducted here — it is deducted in verifyGCashPayment once
    // the payment actually succeeds. This prevents phantom stock holds when
    // users abandon the Maya Wallet flow.
    const subtotal = cartItems.reduce(
      (sum: number, item: any) => sum + item.product.price * item.quantity,
      0,
    );

    const discount = dto.discount ?? 0;
    const total = subtotal - discount;

    // Use BACKEND_URL for payment callbacks (Express runs on port 3001)
    // Use FRONTEND_URL for user-facing pages
    const backendUrl =
      process.env.BACKEND_URL ??
      `http://localhost:${process.env.PORT || "3001"}`;

    const intent = await paymongoUtils.createPaymentIntent(total);
    paymentIntentId = intent.intentId;

    const { redirectUrl } = await paymongoUtils.attachMayaToIntent(
      intent.intentId,
      intent.clientKey,
      dto.email,
      dto.fullName,
      `${backendUrl}/checkout/callback?intent_id=${intent.intentId}`,
    );

    mayaRedirectUrl = redirectUrl;
  } else {
    // ── COD / Card: deduct stock immediately ──────────────────────────────────
    await orderRepository.deductStock(cartItems);

    // Mark affiliate as paid and activate for COD orders
    if (owner.userId) {
      await markAffiliateAsPaidByUserId(owner.userId);
      await activateAffiliateByUserId(owner.userId);
    }
  }

  // Create order with attribution data
  const order = await createOrderWithAttribution(
    owner,
    dto,
    cartItems,
    paymentIntentId,
    attributionData,
  );

  // Create attribution record if affiliate is specified
  if (attributionData?.affiliateId) {
    try {
      await trackingService.attributeOrderFromData(order.id, {
        affiliateId: attributionData.affiliateId,
        pixelId: attributionData.pixelId,
        storeId: attributionData.storeId,
        clickId: attributionData.clickId,
        trackingMethod: (attributionData.trackingMethod as any) || "url_param",
      });
    } catch (error) {
      console.error("Failed to attribute order to affiliate:", error);
      // Don't fail the order if attribution fails
    }
  }

  await cartService.clearCart(owner);

  return { order, mayaRedirectUrl };
};

// ── Internal: Create Order with Attribution ─────────────────────────────────

const createOrderWithAttribution = async (
  owner: CartOwner,
  dto: CreateOrderDTO,
  cartItems: any[],
  paymentIntentId?: string,
  attributionData?: {
    affiliateId?: string;
    pixelId?: string;
    storeId?: string;
    clickId?: string;
    trackingMethod?: string;
  },
) => {
  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0,
  );

  const discount = dto.discount ?? 0;
  const total = subtotal - discount;

  const orderData: any = {
    user_id: owner.userId ?? null,
    guest_id: owner.guestId ?? null,
    full_name: dto.fullName,
    email: dto.email,
    phone_number: dto.phoneNumber,
    shipping_address: dto.shippingAddress,
    order_notes: dto.orderNotes ?? null,
    payment_method: dto.paymentMethod,
    payment_status: "pending",
    status: "pending",
    subtotal,
    total: total,
    payment_intent_id: paymentIntentId ?? null,
  };

  // Add affiliate attribution if present
  if (attributionData?.affiliateId) {
    orderData.affiliate_id = attributionData.affiliateId;
    orderData.tracking_method = attributionData.trackingMethod || "url_param";
    orderData.click_id = attributionData.clickId || null;
  }

  const { data: order, error: orderError } = await supabaseAdmin
    .from("orders")
    .insert(orderData)
    .select("id")
    .single();

  if (orderError) throw new AppError(orderError.message, 500);
  if (!order) throw new AppError("Failed to create order", 500);

  const orderId = order.id;

  const orderItems = cartItems.map((item) => ({
    order_id: orderId,
    product_id: item.product_id ?? item.productId ?? item.product?.id,
    quantity: item.quantity,
    unit_price: item.product.price,
  }));

  const { error: itemsError } = await supabaseAdmin
    .from("order_items")
    .insert(orderItems);

  if (itemsError) throw new AppError(itemsError.message, 500);

  return orderRepository.findOrderById(orderId);
};

// ── Verify GCash Payment (called from callback page + webhook) ────────────────

export const verifyGCashPayment = async (intentId: string) => {
  const status = await paymongoUtils.getPaymentIntentStatus(intentId);

  const order = await orderRepository.findOrderByIntentId(intentId);
  if (!order)
    throw new AppError("Order not found for this payment intent", 404);

  // Avoid double-processing already confirmed orders
  if (order.status === "confirmed") {
    return { status: "succeeded", orderId: order.id, alreadyConfirmed: true };
  }

  if (status === "succeeded") {
    // Deduct stock now that payment is confirmed
    const orderItems = await getOrderItemsAsCartItems(order.id);
    await orderRepository.deductStock(orderItems);

    await orderRepository.updatePaymentStatus(intentId, "paid");
    await orderRepository.updateOrderStatus(order.id, "confirmed");
    await affiliateSalesService.recordSalesForOrder(order.id);

    // Fire Meta Pixel Purchase event if order has affiliate
    const orderWithAffiliate = order as any;
    if (orderWithAffiliate.affiliate_id) {
      try {
        await pixelService.firePurchaseEvent(
          order.id,
          orderWithAffiliate.affiliate_id,
        );
      } catch (error) {
        console.error("Failed to fire Meta Pixel event:", error);
        // Don't fail the order if pixel event fails
      }
    }

    // Mark affiliate as paid and activate (upgrade from pending to active)
    if (order.user_id) {
      await markAffiliateAsPaidByUserId(order.user_id);
      await activateAffiliateByUserId(order.user_id);
    }
  } else if (status === "payment_intent.payment_failed") {
    await orderRepository.updatePaymentStatus(intentId, "failed");
    // No stock was deducted for GCash, so no restore needed here
  }

  return { status, orderId: order.id, alreadyConfirmed: false };
};

// ── Standard CRUD ─────────────────────────────────────────────────────────────

export const getOrder = (id: string) => orderRepository.findOrderById(id);

export const getOrders = (owner: CartOwner) =>
  orderRepository.findOrdersByOwner(owner);

export const getAllOrders = (
  page: number,
  limit: number,
  status?: OrderStatus,
) => orderRepository.findAllOrders(page, limit, status);

export const updateOrderStatus = async (id: string, status: OrderStatus) => {
  if (status === "cancelled") {
    await orderRepository.restoreStock(id);
  }
  const updated = await orderRepository.updateOrderStatus(id, status);

  // Record affiliate commissions on delivery
  if (status === "delivered") {
    await affiliateSalesService.recordSalesForOrder(id);

    // Fire Meta Pixel Purchase event on delivery if order has affiliate
    const order = await orderRepository.findOrderById(id);
    if (order?.affiliate_id) {
      try {
        await pixelService.firePurchaseEvent(id, order.affiliate_id);
      } catch (error) {
        console.error("Failed to fire Meta Pixel event on delivery:", error);
      }
    }
  }

  return updated;
};

// ── Internal helpers ──────────────────────────────────────────────────────────

// Fetch order items and reshape them to match the cartItems shape expected
// by deductStock so we can reuse the same helper for GCash confirmation.
const getOrderItemsAsCartItems = async (orderId: string) => {
  const order = await orderRepository.findOrderById(orderId);
  if (!order) throw new AppError("Order not found", 404);

  return ((order.items ?? []) as any[]).map((item: any) => ({
    product_id: item.product_id,
    quantity: item.quantity,
    product: item.product,
  }));
};
