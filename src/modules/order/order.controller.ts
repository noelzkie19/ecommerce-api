import { Request, Response } from "express";
import { catchAsync } from "../../common/utils/catchAsync";
import { sendSuccess } from "../../common/utils/response";
import { AppError } from "../../common/utils/AppError";
import { resolveOwner } from "../../common/resolvers/owner.resolver";
import {
  validateUpdateOrderStatus,
  validateOrderIdParam,
  validatePaginatedQuery,
} from "../../common/validators/order.validator";
import type { OrderStatus } from "../../domain/entities/Order";
import { resolve, TOKENS } from "../../di/container";
import { IOrderRepository } from "../../domain/interfaces/IOrderRepository";

/**
 * Get order repository instance
 */
function getOrderRepository(): IOrderRepository {
  return resolve<IOrderRepository>(TOKENS.IOrderRepository);
}

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
  async (_req: Request, res: Response): Promise<void> => {
    // PlaceOrder requires complex business logic - temporarily stubbed
    const result = { order: null, mayaRedirectUrl: null };
    sendSuccess(
      res,
      result,
      "Order functionality requires use-case implementation",
      501,
    );
  },
);

// ── Get Single Order ──────────────────────────────────────────────────────────

export const getOrder = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = validateOrderIdParam(req.params);
    const owner = resolveOwner(req, { required: true });
    const orderRepo = getOrderRepository();
    const order = await orderRepo.findOrderById(id);

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
    const orderRepo = getOrderRepository();
    const orders = await orderRepo.findOrdersByOwner(owner);
    sendSuccess(res, orders);
  },
);

// ── Admin: Get Single Order (no ownership check) ──────────────────────────────

export const getOrderAdmin = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = validateOrderIdParam(req.params);
    const orderRepo = getOrderRepository();
    const order = await orderRepo.findOrderById(id);
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

    const orderRepo = getOrderRepository();
    const result = await orderRepo.findAllOrders(page, limit, validStatus);
    sendSuccess(res, result);
  },
);

// ── Admin: Update Order Status ────────────────────────────────────────────────

export const updateOrderStatus = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = validateOrderIdParam(req.params);
    const { status } = validateUpdateOrderStatus(req.body);

    const orderRepo = getOrderRepository();
    const order = await orderRepo.updateStatus(id, status);
    sendSuccess(res, order, "Order status updated successfully");
  },
);

// ── GCash: Verify Payment (called from frontend callback page) ────────────────

export const verifyGCashPayment = catchAsync(
  async (_req: Request, res: Response): Promise<void> => {
    // verifyGCashPayment requires complex business logic - stubbed
    const result = { status: "pending", orderId: "", alreadyConfirmed: false };
    sendSuccess(
      res,
      result,
      "Payment verification requires use-case implementation",
      501,
    );
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
      // Webhook requires complex business logic - stubbed
    }

    // Always return 200 so PayMongo doesn't retry
    sendSuccess(res, null, "Webhook received");
  },
);
