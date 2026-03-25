import { Router } from "express";
import { optionalAuth, requireAuth } from "../auth/auth.middleware";
import * as orderController from "./order.controller";

const router = Router();

// ── Admin Routes ──────────────────────────────────────────────────────────────

/**
 * @openapi
 * /api/orders/admin/all:
 *   get:
 *     tags: [Orders]
 *     summary: Get all orders (Admin)
 *     description: Retrieve all orders with pagination. Requires admin authentication.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, confirmed, processing, shipped, delivered, cancelled]
 *         description: Filter by order status
 *     responses:
 *       200:
 *         description: List of orders
 *       401:
 *         description: Unauthorized
 */
router.get("/admin/all", requireAuth, orderController.getAllOrders);

/**
 * @openapi
 * /api/orders/admin/{id}:
 *   get:
 *     tags: [Orders]
 *     summary: Get order by ID (Admin)
 *     description: Retrieve a specific order by ID. Requires admin authentication.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Order details
 *       404:
 *         description: Order not found
 */
router.get("/admin/:id", requireAuth, orderController.getOrderAdmin);

/**
 * @openapi
 * /api/orders/admin/{id}/status:
 *   patch:
 *     tags: [Orders]
 *     summary: Update order status (Admin)
 *     description: Update the status of a specific order. Requires admin authentication.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, confirmed, processing, shipped, delivered, cancelled]
 *                 example: confirmed
 *     responses:
 *       200:
 *         description: Order status updated
 *       400:
 *         description: Invalid status
 */
router.patch(
  "/admin/:id/status",
  requireAuth,
  orderController.updateOrderStatus,
);

/**
 * @openapi
 * /api/orders/admin/{id}/payment-status:
 *   patch:
 *     tags: [Orders]
 *     summary: Mark COD order as paid (Admin)
 *     description: Manually mark a COD order's payment status as paid. Only applicable to COD orders.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Payment status updated to paid
 *       400:
 *         description: Not a COD order or already paid
 *       404:
 *         description: Order not found
 */
router.patch(
  "/admin/:id/payment-status",
  requireAuth,
  orderController.markCodOrderPaid,
);

// ── PayMongo Webhook ──────────────────────────────────────────────────────────
// No auth — PayMongo calls this directly from their servers

/**
 * @openapi
 * /api/orders/webhook/paymongo:
 *   post:
 *     tags: [Orders]
 *     summary: PayMongo webhook
 *     description: Webhook endpoint for PayMongo payment notifications. No authentication required.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Webhook processed
 */
router.post("/webhook/paymongo", orderController.paymongoWebhook);

// ── GCash Callback Verification ───────────────────────────────────────────────
// Called by frontend after user returns from GCash

/**
 * @openapi
 * /api/orders/verify-gcash:
 *   get:
 *     tags: [Orders]
 *     summary: Verify GCash payment and redirect to frontend
 *     description: >
 *       Verifies payment status for a GCash transaction and redirects the browser
 *       to the frontend callback page at `{FRONTEND_URL}/payment/callback` with
 *       query parameters: `status` (succeeded|pending|failed), `order_id`, and
 *       `already_confirmed`. This endpoint is used as the PayMongo return URL
 *       after the user completes or cancels GCash payment.
 *     parameters:
 *       - in: query
 *         name: payment_intent_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Payment intent ID from PayMongo
 *     responses:
 *       302:
 *         description: >
 *           Redirects to frontend callback URL, e.g.
 *           `{FRONTEND_URL}/payment/callback?status=succeeded&order_id=...&already_confirmed=false`
 */
router.get("/verify-gcash", orderController.verifyGCashPayment);

// ── User / Guest Routes ───────────────────────────────────────────────────────
// optionalAuth: passes req.user if token present, continues as guest otherwise.
// Both authenticated users and guests (via x-guest-id header) can:
//   POST /        — place an order
//   GET  /        — list their own orders
//   GET  /:id     — view a single order (ownership enforced in controller)

router.use(optionalAuth);

/**
 * @openapi
 * /api/orders:
 *   post:
 *     tags: [Orders]
 *     summary: Place a new order
 *     description: Create a new order. Supports both authenticated users and guest checkout.
 *     parameters:
 *       - in: header
 *         name: x-guest-id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Guest ID (required for guest checkout)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fullName
 *               - email
 *               - phoneNumber
 *               - shippingAddress
 *               - paymentMethod
 *             properties:
 *               fullName:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               phoneNumber:
 *                 type: string
 *                 example: +639123456789
 *               shippingAddress:
 *                 type: string
 *                 example: 123 Main St, Manila
 *               paymentMethod:
 *                 type: string
 *                 enum: [maya, cod]
 *                 example: cod
 *               discount:
 *                 type: number
 *                 example: 0
 *               orderNotes:
 *                 type: string
 *                 example: Please ring doorbell
 *     responses:
 *       201:
 *         description: Order placed successfully
 *       400:
 *         description: Validation error or cart empty
 */
router.post("/", orderController.placeOrder);

/**
 * @openapi
 * /api/orders:
 *   get:
 *     tags: [Orders]
 *     summary: Get user's orders
 *     description: Retrieve orders for the authenticated user or guest.
 *     parameters:
 *       - in: header
 *         name: x-guest-id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Guest ID (required for guest orders)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of orders
 */
router.get("/", orderController.getOrders);

/**
 * @openapi
 * /api/orders/{id}:
 *   get:
 *     tags: [Orders]
 *     summary: Get order by ID
 *     description: Retrieve a specific order. Ownership is verified.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Order ID
 *       - in: header
 *         name: x-guest-id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Guest ID (required for guest orders)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Order details
 *       403:
 *         description: Forbidden - not the order owner
 *       404:
 *         description: Order not found
 */
router.get("/:id", orderController.getOrder);

export default router;
