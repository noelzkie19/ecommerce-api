import { Router } from "express";
import { optionalAuth, requireAuth } from "../auth/auth.middleware";
import * as orderController from "./order.controller";

const router = Router();

// ── Admin Routes ──────────────────────────────────────────────────────────────

router.get("/admin/all", requireAuth, orderController.getAllOrders);
router.get("/admin/:id", requireAuth, orderController.getOrderAdmin);
router.patch(
  "/admin/:id/status",
  requireAuth,
  orderController.updateOrderStatus,
);

// ── PayMongo Webhook ──────────────────────────────────────────────────────────
// No auth — PayMongo calls this directly from their servers
router.post("/webhook/paymongo", orderController.paymongoWebhook);

// ── GCash Callback Verification ───────────────────────────────────────────────
// Called by frontend after user returns from GCash
router.get("/verify-gcash/:intentId", orderController.verifyGCashPayment);

// ── User / Guest Routes ───────────────────────────────────────────────────────
// optionalAuth: passes req.user if token present, continues as guest otherwise.
// Both authenticated users and guests (via x-guest-id header) can:
//   POST /        — place an order
//   GET  /        — list their own orders
//   GET  /:id     — view a single order (ownership enforced in controller)

router.use(optionalAuth);

router.post("/", orderController.placeOrder);
router.get("/", orderController.getOrders);
router.get("/:id", orderController.getOrder);

export default router;
