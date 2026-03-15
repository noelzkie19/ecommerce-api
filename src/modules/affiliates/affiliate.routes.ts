import { Router } from "express";
import { requireAuth, requireAdmin } from "../auth/auth.middleware";
import * as affiliateController from "./affiliate.controller";

const router = Router();

// Public route: PayMongo webhook for affiliate payments
router.post("/webhook", affiliateController.paymongoWebhook);

// Public route: Verify payment callback (after GCash payment)
router.get("/payment/verify", affiliateController.verifyAffiliatePayment);

// Protected route: Get current user's affiliate status
/**
 * @openapi
 * /api/affiliates/me:
 *   get:
 *     tags: [Affiliates]
 *     summary: Get current user's affiliate status
 *     description: Retrieve the authenticated user's affiliate information including store ID, pixel ID, and created date.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user's affiliate status
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
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     status:
 *                       type: string
 *                       enum: [pending, active, suspended]
 *                     paymentStatus:
 *                       type: string
 *                       enum: [unpaid, paid]
 *                     email:
 *                       type: string
 *                     name:
 *                       type: string
 *                     storeId:
 *                       type: string
 *                     pixelId:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: No affiliate record found
 */
router.get("/me", requireAuth, affiliateController.getMyAffiliateStatus);

// Protected route: Create payment for affiliate registration
router.post(
  "/payment/create",
  requireAuth,
  affiliateController.createAffiliatePayment,
);

/**
 * @openapi
 * /api/affiliates/me/pixel:
 *   patch:
 *     tags: [Affiliates]
 *     summary: Update current user's pixel ID
 *     description: Allows an authenticated affiliate to update their own Meta Pixel ID.
 *     security:
 *       - bearerAuth: []
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
 *                 example: "123412312"
 *     responses:
 *       200:
 *         description: Pixel ID updated successfully
 *       400:
 *         description: pixelId is required
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Affiliate not found
 */
router.patch("/me/pixel", requireAuth, affiliateController.updateMyPixelId);

// ── Affiliate Link (User) ─────────────────────────────────────────────────────

/**
 * @openapi
 * /api/affiliates/me/link:
 *   get:
 *     tags: [Affiliates]
 *     summary: Get current user's affiliate referral link
 *     description: Retrieve the authenticated user's unique affiliate referral link.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Affiliate link retrieved
 *       401:
 *         description: Unauthorized
 */
router.get("/me/link", requireAuth, affiliateController.getMyAffiliateLink);

// All other affiliate routes are admin-only
router.use(requireAuth, requireAdmin);

// ── Affiliate collection ──────────────────────────────────────────────────────

/**
 * @openapi
 * /api/affiliates:
 *   get:
 *     tags: [Affiliates]
 *     summary: Get all affiliates (Admin)
 *     description: Retrieve paginated affiliates with aggregate stats. Requires admin authentication.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Filter by affiliate name
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, suspended]
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: Paginated list of affiliates
 *       401:
 *         description: Unauthorized
 */
router.get("/", affiliateController.getAffiliates);

/**
 * @openapi
 * /api/affiliates:
 *   post:
 *     tags: [Affiliates]
 *     summary: Invite / create affiliate (Admin)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *             properties:
 *               name:
 *                 type: string
 *                 example: Jane Smith
 *               email:
 *                 type: string
 *                 format: email
 *                 example: jane@example.com
 *               pixelId:
 *                 type: string
 *                 description: Meta Pixel ID for tracking
 *                 example: 1234567890
 *               storeId:
 *                 type: string
 *                 description: Store ID for affiliate
 *                 example: store_abc123
 *     responses:
 *       201:
 *         description: Affiliate created
 *       409:
 *         description: Email already registered
 */
router.post("/", affiliateController.createAffiliate);

// ── Affiliate by ID ───────────────────────────────────────────────────────────

/**
 * @openapi
 * /api/affiliates/{id}:
 *   get:
 *     tags: [Affiliates]
 *     summary: Get affiliate by ID (Admin)
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
 *         description: Affiliate details
 *       404:
 *         description: Not found
 */
router.get("/:id", affiliateController.getAffiliate);

/**
 * @openapi
 * /api/affiliates/{id}:
 *   patch:
 *     tags: [Affiliates]
 *     summary: Update affiliate (Admin)
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
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               status:
 *                 type: string
 *                 enum: [active, suspended]
 *               pixelId:
 *                 type: string
 *                 description: Meta Pixel ID for tracking
 *               storeId:
 *                 type: string
 *                 description: Store ID for affiliate
 *     responses:
 *       200:
 *         description: Affiliate updated
 */
router.patch("/:id", affiliateController.updateAffiliate);

/**
 * @openapi
 * /api/affiliates/{id}:
 *   delete:
 *     tags: [Affiliates]
 *     summary: Delete affiliate (Admin)
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
 *       204:
 *         description: Deleted
 */
router.delete("/:id", affiliateController.deleteAffiliate);

// ── Suspend / Activate shortcuts ──────────────────────────────────────────────

/**
 * @openapi
 * /api/affiliates/{id}/suspend:
 *   patch:
 *     tags: [Affiliates]
 *     summary: Suspend affiliate (Admin)
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
 *         description: Affiliate suspended
 */
router.patch("/:id/suspend", affiliateController.suspendAffiliate);

/**
 * @openapi
 * /api/affiliates/{id}/activate:
 *   patch:
 *     tags: [Affiliates]
 *     summary: Activate affiliate (Admin)
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
 *         description: Affiliate activated
 */
router.patch("/:id/activate", affiliateController.activateAffiliate);

// ── Affiliate Products ────────────────────────────────────────────────────────

/**
 * @openapi
 * /api/affiliates/{id}/products:
 *   get:
 *     tags: [Affiliates]
 *     summary: Get products assigned to an affiliate (Admin)
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
 *         description: List of assigned products
 */
router.get("/:id/products", affiliateController.getAffiliateProducts);

/**
 * @openapi
 * /api/affiliates/{id}/products:
 *   post:
 *     tags: [Affiliates]
 *     summary: Assign a product to an affiliate (Admin)
 *     description: Assigns a product with a commission rule. Re-assigning the same product updates the commission.
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
 *               - productId
 *               - commissionType
 *               - commissionValue
 *             properties:
 *               productId:
 *                 type: string
 *                 format: uuid
 *               commissionType:
 *                 type: string
 *                 enum: [percentage, fixed]
 *                 example: percentage
 *               commissionValue:
 *                 type: number
 *                 example: 20
 *     responses:
 *       201:
 *         description: Product assigned
 *       400:
 *         description: Validation error
 */
router.post("/:id/products", affiliateController.assignProduct);

/**
 * @openapi
 * /api/affiliates/{id}/products/{productId}:
 *   delete:
 *     tags: [Affiliates]
 *     summary: Remove a product from an affiliate (Admin)
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
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       204:
 *         description: Product removed
 */
router.delete("/:id/products/:productId", affiliateController.removeProduct);

// ── Affiliate Settings (Admin) ─────────────────────────────────────────────────

/**
 * @openapi
 * /api/affiliates/settings:
 *   get:
 *     tags: [Affiliates]
 *     summary: Get affiliate settings (Admin)
 *     description: Retrieve commission rates and registration fee settings.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Settings retrieved
 */
router.get("/settings", affiliateController.getAffiliateSettings);

/**
 * @openapi
 * /api/affiliates/settings:
 *   patch:
 *     tags: [Affiliates]
 *     summary: Update affiliate settings (Admin)
 *     description: Update commission rates and registration fee.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               registrationFee:
 *                 type: number
 *                 example: 999
 *               referralCommissionRate:
 *                 type: number
 *                 example: 20
 *               referralCommissionType:
 *                 type: string
 *                 enum: [percentage, fixed]
 *                 example: percentage
 *     responses:
 *       200:
 *         description: Settings updated
 */
router.patch("/settings", affiliateController.updateAffiliateSettings);

// ── Affiliate Link (User) ─────────────────────────────────────────────────────

/**
 * @openapi
 * /api/affiliates/me/link:
 *   get:
 *     tags: [Affiliates]
 *     summary: Get current user's affiliate referral link
 *     description: Retrieve the authenticated user's unique affiliate referral link.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Affiliate link retrieved
 *       401:
 *         description: Unauthorized
 */
router.get("/me/link", affiliateController.getMyAffiliateLink);

export default router;
