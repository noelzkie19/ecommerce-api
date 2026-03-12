import { Request, Response } from "express";
import { catchAsync } from "../../common/utils/catchAsync";
import { sendSuccess } from "../../common/utils/response";
import { AppError } from "../../common/utils/AppError";
import { resolveOwner } from "../../common/resolvers/owner.resolver";
import {
  validateCreateOrder,
  validateUpdateOrderStatus,
  validateIntentIdParam,
  validateOrderIdParam,
  validatePaginatedQuery,
} from "../../common/validators/order.validator";
import { OrderStatus } from "./order.types";
import * as orderService from "./order.service";

const VALID_STATUSES = new Set<OrderStatus>([
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
]);

// ── Place Order ───────────────────────────────────────────────────────────────

export const placeOrder = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const owner = resolveOwner(req, { required: true });
    const dto = validateCreateOrder(req.body);

    // result = { order, gcashRedirectUrl }
    // gcashRedirectUrl is null for COD/card — frontend ignores it
    const result = await orderService.placeOrder(owner, dto);
    sendSuccess(res, result, "Order placed successfully", 201);
  },
);

// ── Get Single Order ──────────────────────────────────────────────────────────

export const getOrder = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = validateOrderIdParam(req.params);
    const owner = resolveOwner(req, { required: true });
    const order = await orderService.getOrder(id);

    if (!order) throw new AppError("Order not found", 404);

    // Verify the caller owns this order
    const ownerMatches =
      (owner.userId && order.user_id === owner.userId) ||
      (owner.guestId && order.guest_id === owner.guestId);

    if (!ownerMatches) throw new AppError("Forbidden", 403);

    sendSuccess(res, order);
  },
);

// ── Get Orders by Owner ───────────────────────────────────────────────────────

export const getOrders = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const owner = resolveOwner(req, { required: true });
    const orders = await orderService.getOrders(owner);
    sendSuccess(res, orders);
  },
);

// ── Admin: Get Single Order (no ownership check) ──────────────────────────────

export const getOrderAdmin = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = validateOrderIdParam(req.params);
    const order = await orderService.getOrder(id);
    if (!order) throw new AppError("Order not found", 404);
    sendSuccess(res, order);
  },
);

// ── Admin: Get All Orders ─────────────────────────────────────────────────────

export const getAllOrders = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { page, limit, status } = validatePaginatedQuery(req.query);

    const validStatus =
      status && VALID_STATUSES.has(status as OrderStatus)
        ? (status as OrderStatus)
        : undefined;

    const result = await orderService.getAllOrders(page, limit, validStatus);
    sendSuccess(res, result);
  },
);

// ── Admin: Update Order Status ────────────────────────────────────────────────

export const updateOrderStatus = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = validateOrderIdParam(req.params);
    const { status } = validateUpdateOrderStatus(req.body);

    const order = await orderService.updateOrderStatus(id, status);
    sendSuccess(res, order, "Order status updated successfully");
  },
);

// ── GCash: Verify Payment (called from frontend callback page) ────────────────

export const verifyGCashPayment = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { intentId } = validateIntentIdParam(req.params);

    const result = await orderService.verifyGCashPayment(intentId);
    sendSuccess(res, result, "Payment verified");
  },
);

// ── PayMongo Webhook (auto-confirm as backup) ─────────────────────────────────

export const paymongoWebhook = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const event = req.body?.data?.attributes;

    if (!event) {
      throw new AppError("Invalid webhook payload", 400);
    }

    if (event.type === "payment.paid") {
      const intentId = event.data?.attributes?.payment_intent_id as
        | string
        | undefined;

      if (intentId) {
        await orderService.verifyGCashPayment(intentId);
      }
    }

    // Always return 200 so PayMongo doesn't retry
    sendSuccess(res, null, "Webhook received");
  },
);
