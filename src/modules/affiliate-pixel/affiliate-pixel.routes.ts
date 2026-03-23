import { Router } from "express";
import { requireAuth } from "../auth/auth.middleware";
import * as pixelController from "./affiliate-pixel.controller";

const router = Router();

// ── Public Test Endpoint ───────────────────────────────────────────────
// Test pixel config - no auth required for easier testing
router.post("/pixel/test", pixelController.testPixelConfig);

// ── Protected Routes ─────────────────────────────────────────────────
// All other pixel routes require authentication
router.use(requireAuth);

// ── Pixel Configuration ─────────────────────────────────────────────────

/**
 * @openapi
 * /api/affiliate-pixel/affiliates/{id}/pixel-config:
 *   get:
 *     tags: [Affiliate Pixel]
 *     summary: Get pixel configuration for an affiliate
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Pixel configuration
 */
router.get("/affiliates/:id/pixel-config", pixelController.getPixelConfig);

/**
 * @openapi
 * /api/affiliate-pixel/affiliates/{id}/pixel-config:
 *   patch:
 *     tags: [Affiliate Pixel]
 *     summary: Update pixel configuration for an affiliate
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               pixelId:
 *                 type: string
 *                 example: "1234567890"
 *               pixelAccessToken:
 *                 type: string
 *               enablePurchaseEvent:
 *                 type: boolean
 *               enableLeadEvent:
 *                 type: boolean
 *               conversionValueType:
 *                 type: string
 *                 enum: [sale_amount, commission, fixed]
 *               conversionValueFixed:
 *                 type: number
 *     responses:
 *       200:
 *         description: Pixel configuration updated
 */
router.patch("/affiliates/:id/pixel-config", pixelController.updatePixelConfig);

/**
 * @openapi
 * /api/affiliate-pixel/pixel/test:
 *   post:
 *     tags: [Affiliate Pixel]
 *     summary: Test pixel configuration (public - no auth required)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - pixelId
 *             properties:
 *               pixelId:
 *                 type: string
 *                 example: "1101803511857717"
 *               testEventCode:
 *                 type: string
 *                 example: "TEST5494"
 *     responses:
 *       200:
 *         description: Test result
 */
router.post("/pixel/test", pixelController.testPixelConfig);

// ── Pixel Events ───────────────────────────────────────────────────────

/**
 * @openapi
 * /api/affiliate-pixel/affiliates/{id}/pixel-events:
 *   get:
 *     tags: [Affiliate Pixel]
 *     summary: Get pixel events for an affiliate
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: List of pixel events
 */
router.get("/affiliates/:id/pixel-events", pixelController.getPixelEvents);

/**
 * @openapi
 * /api/affiliate-pixel/pixel/fire-purchase:
 *   post:
 *     tags: [Affiliate Pixel]
 *     summary: Fire a purchase event manually
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *               - affiliateId
 *             properties:
 *               orderId:
 *                 type: string
 *                 format: uuid
 *               affiliateId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Event fired
 */
router.post("/pixel/fire-purchase", pixelController.firePurchaseEvent);

/**
 * @openapi
 * /api/affiliate-pixel/pixel/fire-lead:
 *   post:
 *     tags: [Affiliate Pixel]
 *     summary: Fire a lead event manually
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *               - affiliateId
 *             properties:
 *               orderId:
 *                 type: string
 *                 format: uuid
 *               affiliateId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Event fired
 */
router.post("/pixel/fire-lead", pixelController.fireLeadEvent);

// ── Retry ────────────────────────────────────────────────────────────────

/**
 * @openapi
 * /api/affiliate-pixel/pixel/retry-failed:
 *   post:
 *     tags: [Affiliate Pixel]
 *     summary: Retry sending failed pixel events
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Retry completed
 */
router.post("/pixel/retry-failed", pixelController.retryFailedEvents);

export default router;
