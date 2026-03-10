import { Request, Response } from "express";
import { catchAsync } from "../../common/utils/catchAsync";
import { sendSuccess } from "../../common/utils/response";
import { AppError } from "../../common/utils/AppError";
import { CartOwner } from "../cart/cart.types";
import { CreateOrderDTO, OrderStatus } from "./order.types";
import * as orderService from "./order.service";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const VALID_STATUSES: OrderStatus[] = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

const resolveOwner = (req: Request): CartOwner => {
  if (req.user?.id) return { userId: req.user.id };

  const guestId = req.headers["x-guest-id"];
  if (typeof guestId === "string" && UUID_REGEX.test(guestId)) {
    return { guestId };
  }

  throw new AppError(
    "A valid x-guest-id header (UUID) is required for guest order access",
    400,
  );
};

// ── Place Order ───────────────────────────────────────────────────────────────

export const placeOrder = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const owner = resolveOwner(req);
    const dto = req.body as CreateOrderDTO;

    if (!dto.fullName) throw new AppError("fullName is required", 400);
    if (!dto.email) throw new AppError("email is required", 400);
    if (!dto.phoneNumber) throw new AppError("phoneNumber is required", 400);
    if (!dto.shippingAddress)
      throw new AppError("shippingAddress is required", 400);
    if (!dto.paymentMethod)
      throw new AppError("paymentMethod is required", 400);

    // result = { order, gcashRedirectUrl }
    // gcashRedirectUrl is null for COD/card — frontend ignores it
    const result = await orderService.placeOrder(owner, dto);
    sendSuccess(res, result, "Order placed successfully", 201);
  },
);

// ── Get Single Order ──────────────────────────────────────────────────────────

export const getOrder = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const id = String(req.params.id);
    const owner = resolveOwner(req);
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
    const owner = resolveOwner(req);
    const orders = await orderService.getOrders(owner);
    sendSuccess(res, orders);
  },
);

// ── Admin: Get Single Order (no ownership check) ──────────────────────────────

export const getOrderAdmin = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const id = String(req.params.id);
    const order = await orderService.getOrder(id);
    if (!order) throw new AppError("Order not found", 404);
    sendSuccess(res, order);
  },
);

// ── Admin: Get All Orders ─────────────────────────────────────────────────────

export const getAllOrders = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const rawPage = typeof req.query.page === "string" ? req.query.page : "1";
    const rawLimit =
      typeof req.query.limit === "string" ? req.query.limit : "10";
    const page = Math.max(1, Number.parseInt(rawPage, 10));
    const limit = Math.min(100, Math.max(1, Number.parseInt(rawLimit, 10)));

    const rawStatus = req.query.status as string | undefined;
    const status =
      rawStatus && VALID_STATUSES.includes(rawStatus as OrderStatus)
        ? (rawStatus as OrderStatus)
        : undefined;

    const result = await orderService.getAllOrders(page, limit, status);
    sendSuccess(res, result);
  },
);

// ── Admin: Update Order Status ────────────────────────────────────────────────

export const updateOrderStatus = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const id = String(req.params.id);
    const { status } = req.body as { status: OrderStatus };

    if (!status) throw new AppError("status is required", 400);
    if (!VALID_STATUSES.includes(status))
      throw new AppError(
        `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}`,
        400,
      );

    const order = await orderService.updateOrderStatus(id, status);
    sendSuccess(res, order, "Order status updated successfully");
  },
);

// ── GCash: Verify Payment (called from frontend callback page) ────────────────

export const verifyGCashPayment = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const intentId = String(req.params.intentId);
    if (!intentId) throw new AppError("intentId is required", 400);

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
