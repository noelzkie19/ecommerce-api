import { Router } from "express";
import { requireAuth } from "../auth/auth.middleware";
import * as trackingController from "./affiliate-tracking.controller";

const router = Router();

// ── Public Routes (no auth required) ─────────────────────────────────────────

/**
 * @openapi
 * /api/affiliate-tracking/resolve:
 *   get:
 *     tags: [Affiliate Tracking]
 *     summary: Resolve a ?ref= store ID to affiliate attribution data
 *     description: |
 *       Public endpoint called by the frontend when it detects a ?ref=store_id
 *       query parameter on page load. Returns the affiliateId and pixelId so the
 *       frontend can fire the Meta Pixel PageView event and store the attribution
 *       cookie for later order attribution. The user stays on the ecommerce site.
 *     parameters:
 *       - in: query
 *         name: ref
 *         required: true
 *         schema:
 *           type: string
 *           example: store_abc123
 *         description: The store_id from the affiliate's share link (?ref=store_abc123)
 *     responses:
 *       200:
 *         description: Affiliate attribution data resolved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     affiliateId:
 *                       type: string
 *                       format: uuid
 *                     pixelId:
 *                       type: string
 *                       nullable: true
 *                     storeId:
 *                       type: string
 *                     affiliateName:
 *                       type: string
 *       400:
 *         description: ref query param is required
 *       404:
 *         description: Affiliate not found for this ref
 */
router.get("/resolve", trackingController.resolveRef);

// All other tracking routes require authentication
router.use(requireAuth);

// ── Tracking Links ───────────────────────────────────────────────────────────

/**
 * @openapi
 * /api/affiliates/{id}/tracking-links:
 *   post:
 *     tags: [Affiliate Tracking]
 *     summary: Generate tracking link for an affiliate
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
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - storeId
 *             properties:
 *               storeId:
 *                 type: string
 *                 example: store_abc123
 *               campaignName:
 *                 type: string
 *                 example: summer_sale
 *               landingPageUrl:
 *                 type: string
 *                 example: https://store.com/products
 *               expiresAt:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Tracking link generated
 */
router.post(
  "/affiliates/:id/tracking-links",
  trackingController.generateTrackingLink,
);

/**
 * @openapi
 * /api/affiliates/{id}/tracking-links:
 *   get:
 *     tags: [Affiliate Tracking]
 *     summary: Get all tracking links for an affiliate
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
 *         description: List of tracking links
 */
router.get(
  "/affiliates/:id/tracking-links",
  trackingController.getTrackingLinks,
);

/**
 * @openapi
 * /api/affiliates/{id}/tracking-links/{linkId}:
 *   get:
 *     tags: [Affiliate Tracking]
 *     summary: Get tracking link by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: linkId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Tracking link details
 */
router.get(
  "/affiliates/:id/tracking-links/:linkId",
  trackingController.getTrackingLink,
);

/**
 * @openapi
 * /api/affiliates/{id}/tracking-links/{linkId}:
 *   patch:
 *     tags: [Affiliate Tracking]
 *     summary: Update tracking link
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: linkId
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
 *               campaignName:
 *                 type: string
 *               landingPageUrl:
 *                 type: string
 *               expiresAt:
 *                 type: string
 *                 format: date-time
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Tracking link updated
 */
router.patch(
  "/affiliates/:id/tracking-links/:linkId",
  trackingController.updateTrackingLink,
);

/**
 * @openapi
 * /api/affiliates/{id}/tracking-links/{linkId}:
 *   delete:
 *     tags: [Affiliate Tracking]
 *     summary: Delete tracking link
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: linkId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       204:
 *         description: Tracking link deleted
 */
router.delete(
  "/affiliates/:id/tracking-links/:linkId",
  trackingController.deleteTrackingLink,
);

// ── Attributions ───────────────────────────────────────────────────────────

/**
 * @openapi
 * /api/attributions/orders/{orderId}:
 *   get:
 *     tags: [Affiliate Tracking]
 *     summary: Get attribution for an order
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Attribution details
 */
router.get(
  "/attributions/orders/:orderId",
  trackingController.getAttributionByOrder,
);

/**
 * @openapi
 * /api/attributions/orders/{orderId}:
 *   post:
 *     tags: [Affiliate Tracking]
 *     summary: Manually attribute an order to an affiliate
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - affiliateId
 *             properties:
 *               affiliateId:
 *                 type: string
 *                 format: uuid
 *               clickId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Order attributed
 */
router.post("/attributions/orders/:orderId", trackingController.attributeOrder);

/**
 * @openapi
 * /api/affiliates/{id}/attributions:
 *   get:
 *     tags: [Affiliate Tracking]
 *     summary: Get all attributions for an affiliate
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
 *         description: List of attributions
 */
router.get("/affiliates/:id/attributions", trackingController.getAttributions);

// ── Statistics ───────────────────────────────────────────────────────────

/**
 * @openapi
 * /api/affiliates/{id}/tracking-stats:
 *   get:
 *     tags: [Affiliate Tracking]
 *     summary: Get tracking statistics for an affiliate
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Tracking statistics
 */
router.get(
  "/affiliates/:id/tracking-stats",
  trackingController.getTrackingStats,
);

// ── Cookie Config (Public) ───────────────────────────────────────────────

/**
 * @openapi
 * /api/tracking/cookie-config:
 *   get:
 *     tags: [Affiliate Tracking]
 *     summary: Get cookie configuration for affiliate tracking
 *     responses:
 *       200:
 *         description: Cookie configuration
 */
router.get("/tracking/cookie-config", trackingController.getCookieConfig);

export default router;
