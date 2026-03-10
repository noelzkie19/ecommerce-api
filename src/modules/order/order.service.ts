import * as orderRepository from "./order.repository";
import * as cartRepository from "../cart/cart.repository";
import * as cartService from "../cart/cart.service";
import * as paymongoUtils from "../../utils/paymongo.utils";
import { CartOwner } from "../cart/cart.types";
import { CreateOrderDTO, OrderStatus, PlaceOrderResult } from "./order.types";
import { AppError } from "../../common/utils/AppError";

// ── Place Order ───────────────────────────────────────────────────────────────

export const placeOrder = async (
  owner: CartOwner,
  dto: CreateOrderDTO,
): Promise<PlaceOrderResult> => {
  const cartItems = await cartRepository.findAllByOwner(owner);
  if (!cartItems || cartItems.length === 0) {
    throw new AppError("Cart is empty", 400);
  }

  let paymentIntentId: string | undefined;
  let gcashRedirectUrl: string | null = null;
  let gcashQrCodeUrl: string | null = null;

  if (dto.paymentMethod === "gcash") {
    // ── GCash: create & attach PayMongo intent ────────────────────────────────
    // Stock is NOT deducted here — it is deducted in verifyGCashPayment once
    // the payment actually succeeds. This prevents phantom stock holds when
    // users abandon the GCash flow.
    const subtotal = cartItems.reduce(
      (sum: number, item: any) => sum + item.product.price * item.quantity,
      0,
    );

    const discount = dto.discount ?? 0;
    const total = subtotal - discount;

    const appUrl =
      process.env.APP_URL ??
      process.env.FRONTEND_URL ??
      "http://localhost:3000";

    const intent = await paymongoUtils.createPaymentIntent(total);
    paymentIntentId = intent.intentId;

    const { redirectUrl, qrCodeUrl } = await paymongoUtils.attachGCashToIntent(
      intent.intentId,
      intent.clientKey,
      dto.email,
      dto.fullName,
      `${appUrl}/checkout/callback?intent_id=${intent.intentId}`,
    );

    gcashRedirectUrl = redirectUrl;
    gcashQrCodeUrl = qrCodeUrl;
  } else {
    // ── COD / Card: deduct stock immediately ──────────────────────────────────
    await orderRepository.deductStock(cartItems);
  }

  const order = await orderRepository.createOrder(
    owner,
    dto,
    cartItems,
    paymentIntentId,
  );

  await cartService.clearCart(owner);

  return { order, gcashRedirectUrl, qrCodeUrl: gcashQrCodeUrl };
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
  return orderRepository.updateOrderStatus(id, status);
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
