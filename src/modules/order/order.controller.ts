import { Request, Response } from "express";
import { catchAsync } from "../../common/utils/catchAsync";
import { sendSuccess } from "../../common/utils/response";
import { AppError } from "../../common/utils/AppError";
import { env } from "../../config/env";
import { resolveOwner } from "../../common/resolvers/owner.resolver";
import {
  validateUpdateOrderStatus,
  validateOrderIdParam,
  validatePaginatedQuery,
  validateCreateOrder,
} from "../../common/validators/order.validator";
import type { OrderStatus, PaymentMethod } from "../../domain/entities/Order";
import {
  PlaceOrderUseCase,
  VerifyGCashPaymentUseCase,
  ProcessPaymentWebhookUseCase,
  GetOrderUseCase,
  ListOrdersUseCase,
  GetAllOrdersUseCase,
  GetOrderAdminUseCase,
  UpdateOrderStatusUseCase,
  MarkCodOrderPaidUseCase,
} from "../../application/use-cases/order";

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
    // Validate request body
    const input = validateCreateOrder(req.body);

    // Resolve owner from request (user or guest)
    const owner = resolveOwner(req, { required: true });

    // Extract affiliate attribution from request
    const affiliateAttribution = (req as any).affiliateAttribution || {};

    // Execute the use case
    const placeOrderUseCase = new PlaceOrderUseCase();
    const result = await placeOrderUseCase.execute({
      userId: owner.userId,
      guestId: owner.guestId,
      fullName: input.fullName,
      email: input.email,
      phoneNumber: input.phoneNumber,
      shippingAddress: input.shippingAddress,
      paymentMethod: input.paymentMethod as PaymentMethod,
      orderNotes: input.orderNotes,
      discount: input.discount,
      affiliateId: affiliateAttribution.affiliateId,
      clickId: affiliateAttribution.clickId,
      trackingMethod: affiliateAttribution.trackingMethod,
    });

    sendSuccess(res, result, "Order placed successfully", 201);
  },
);

// ── Get Single Order ──────────────────────────────────────────────────────────

export const getOrder = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = validateOrderIdParam(req.params);
    const owner = resolveOwner(req, { required: true });

    const getOrderUseCase = new GetOrderUseCase();
    const order = await getOrderUseCase.execute({
      orderId: id,
      userId: owner.userId,
      guestId: owner.guestId,
    });

    sendSuccess(res, order);
  },
);

// ── Get Orders by Owner ───────────────────────────────────────────────────────

export const getOrders = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const owner = resolveOwner(req, { required: true });

    const listOrdersUseCase = new ListOrdersUseCase();
    const result = await listOrdersUseCase.execute({
      userId: owner.userId,
      guestId: owner.guestId,
    });

    sendSuccess(res, result.orders);
  },
);

// ── Admin: Get Single Order (no ownership check) ──────────────────────────────

export const getOrderAdmin = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = validateOrderIdParam(req.params);

    const getOrderAdminUseCase = new GetOrderAdminUseCase();
    const order = await getOrderAdminUseCase.execute({ orderId: id });

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

    const getAllOrdersUseCase = new GetAllOrdersUseCase();
    const result = await getAllOrdersUseCase.execute({
      page,
      limit,
      status: validStatus,
    });

    sendSuccess(res, result);
  },
);

// ── Admin: Update Order Status ────────────────────────────────────────────────

export const updateOrderStatus = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = validateOrderIdParam(req.params);
    const { status, trackingNumber } = validateUpdateOrderStatus(req.body);

    const updateOrderStatusUseCase = new UpdateOrderStatusUseCase();
    const order = await updateOrderStatusUseCase.execute({
      orderId: id,
      status,
      trackingNumber,
    });

    sendSuccess(res, order, "Order status updated successfully");
  },
);

// ── Admin: Mark COD Order as Paid ────────────────────────────────────────────

export const markCodOrderPaid = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = validateOrderIdParam(req.params);

    const markCodOrderPaidUseCase = new MarkCodOrderPaidUseCase();
    const result = await markCodOrderPaidUseCase.execute({ orderId: id });

    sendSuccess(res, result, "Order payment status updated to paid");
  },
);

// ── Maya/GCash: Verify Payment (called from frontend callback page) ────────

export const verifyGCashPayment = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    // Get intentId from query parameter (payment_intent_id)
    const intentId = req.query.payment_intent_id as string;

    if (!intentId) {
      // Redirect to frontend with error if no intent ID provided
      const errorUrl = new URL(`${env.FRONTEND_URL}/payment/callback`);
      errorUrl.searchParams.set("status", "failed");
      errorUrl.searchParams.set("error", "missing_payment_intent_id");
      res.redirect(302, errorUrl.toString());
      return;
    }

    // Execute the use case - no ownership check needed for payment verification
    // as this is a return URL from the payment provider
    const verifyPaymentUseCase = new VerifyGCashPaymentUseCase();
    const result = await verifyPaymentUseCase.execute({ intentId });

    // Build the frontend callback URL with payment result
    const callbackUrl = new URL(`${env.FRONTEND_URL}/payment/callback`);
    callbackUrl.searchParams.set("status", result.status);
    if (result.orderId) {
      callbackUrl.searchParams.set("order_id", result.orderId);
    }
    callbackUrl.searchParams.set(
      "already_confirmed",
      String(result.alreadyConfirmed),
    );

    // Redirect the browser to the frontend callback page
    res.redirect(302, callbackUrl.toString());
  },
);

// ── PayMongo Webhook (auto-confirm as backup) ─────────────────────────────────

export const paymongoWebhook = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const event = req.body?.data?.attributes;

    if (!event) {
      throw new AppError("Invalid webhook payload", 400);
    }

    // Extract event details
    const eventType = event.type;
    const paymentIntentId = event.data?.attributes?.payment_intent_id;

    if (!paymentIntentId) {
      throw new AppError("Missing payment_intent_id in webhook", 400);
    }

    // Process the webhook using the use case
    const processWebhookUseCase = new ProcessPaymentWebhookUseCase();
    await processWebhookUseCase.execute({
      eventType,
      paymentIntentId,
    });

    // Always return 200 so PayMongo doesn't retry
    sendSuccess(res, null, "Webhook processed successfully");
  },
);
