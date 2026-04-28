import { Router } from "express";
import multer from "multer";
import { requireAuth, requireAdmin } from "../auth/auth.middleware";
import * as affiliateController from "./affiliate.controller";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

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
 *                       enum: [pending, active, suspended, rejected]
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

// Protected route: Submit payment proof (manual approval workflow)
router.post(
  "/me/payment-proof",
  requireAuth,
  affiliateController.submitPaymentProof,
);

// Protected route: Submit payment proof image (user self-upload)
/**
 * @openapi
 * /api/affiliates/me/payment-proof-image:
 *   post:
 *     tags: [Affiliates]
 *     summary: Upload payment proof image (User)
 *     description: Allows an authenticated affiliate to upload an image file as payment proof. Supports JPEG, PNG, WEBP, GIF (max 5MB).
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *               proofRef:
 *                 type: string
 *                 description: Optional reference note
 *     responses:
 *       200:
 *         description: Payment proof uploaded successfully
 *       400:
 *         description: Invalid file type or no file provided
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Affiliate not found
 */
router.post(
  "/me/payment-proof-image",
  requireAuth,
  upload.single("image"),
  affiliateController.uploadMyPaymentProofImage,
);

// // Protected route: Create payment for affiliate registration (DEPRECATED)

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

// ── Payment Proof Image Upload (Admin) ─────────────────────────────────────────

/**
 * @openapi
 * /api/affiliates/{id}/payment-proof-image:
 *   post:
 *     tags: [Affiliates]
 *     summary: Upload payment proof image for affiliate (Admin)
 *     description: Upload an image file as payment proof for an affiliate. Supports JPEG, PNG, WEBP, GIF (max 5MB).
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *               proofRef:
 *                 type: string
 *                 description: Optional reference note
 *     responses:
 *       200:
 *         description: Payment proof uploaded successfully
 *       400:
 *         description: Invalid file type or no file provided
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin only)
 *       404:
 *         description: Affiliate not found
 */
router.post(
  "/:id/payment-proof-image",
  upload.single("image"),
  affiliateController.uploadPaymentProofImage,
);

// ── Add Payment Proof By Admin (Admin) ─────────────────────────────────────────

/**
 * @openapi
 * /api/affiliates/{id}/payment-proof:
 *   post:
 *     tags: [Affiliates]
 *     summary: Add payment proof for affiliate (Admin)
 *     description: Admin adds payment proof for an affiliate (e.g., during manual approval).
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
 *               - paymentProofUrl
 *             properties:
 *               paymentProofUrl:
 *                 type: string
 *                 description: URL to payment proof (receipt, screenshot, etc.)
 *               paymentProofRef:
 *                 type: string
 *                 description: Optional reference note
 *     responses:
 *       200:
 *         description: Payment proof added successfully
 *       400:
 *         description: paymentProofUrl is required
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin only)
 *       404:
 *         description: Affiliate not found
 */
router.post("/:id/payment-proof", affiliateController.addPaymentProofByAdmin);

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
 *           enum: [pending, active, suspended, rejected]
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
 *               status:
 *                 type: string
 *                 enum: [pending, active, suspended, rejected]
 *               pixelId:
 *                 type: string
 *                 description: Meta Pixel ID
 *               storeId:
 *                 type: string
 *                 description: Store ID
 *     responses:
 *       200:
 *         description: Affiliate updated
 *       404:
 *         description: Not found
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
 *         description: Affiliate deleted
 *       404:
 *         description: Not found
 */
router.delete("/:id", affiliateController.deleteAffiliate);

// ── Affiliate Status Changes ───────────────────────────────────────────────────

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
 *       404:
 *         description: Not found
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
 *       400:
 *         description: Affiliate must complete payment or submit proof first
 *       404:
 *         description: Not found
 */
router.patch("/:id/activate", affiliateController.activateAffiliate);

/**
 * @openapi
 * /api/affiliates/{id}/approve:
 *   post:
 *     tags: [Affiliates]
 *     summary: Approve affiliate (Admin)
 *     description: Approve an affiliate application. Optionally accepts payment proof URL and reference.
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
 *               paymentProofUrl:
 *                 type: string
 *                 description: Optional payment proof URL
 *               paymentProofRef:
 *                 type: string
 *                 description: Optional payment proof reference
 *     responses:
 *       200:
 *         description: Affiliate approved
 *       400:
 *         description: Affiliate must complete payment or submit proof first
 *       404:
 *         description: Not found
 */
router.post("/:id/approve", affiliateController.approveAffiliate);

/**
 * @openapi
 * /api/affiliates/{id}/reject:
 *   post:
 *     tags: [Affiliates]
 *     summary: Reject affiliate (Admin)
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
 *               reason:
 *                 type: string
 *                 description: Optional rejection reason
 *     responses:
 *       200:
 *         description: Affiliate rejected
 *       404:
 *         description: Not found
 */
router.post("/:id/reject", affiliateController.rejectAffiliate);

// ── Affiliate Products ────────────────────────────────────────────────────────

/**
 * @openapi
 * /api/affiliates/{id}/products:
 *   get:
 *     tags: [Affiliates]
 *     summary: Get affiliate products (Admin)
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
 *         description: Affiliate products
 *       404:
 *         description: Not found
 */
router.get("/:id/products", affiliateController.getAffiliateProducts);

/**
 * @openapi
 * /api/affiliates/{id}/products:
 *   post:
 *     tags: [Affiliates]
 *     summary: Assign product to affiliate (Admin)
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
 *               commissionValue:
 *                 type: number
 *     responses:
 *       201:
 *         description: Product assigned
 *       404:
 *         description: Not found
 */
router.post("/:id/products", affiliateController.assignProduct);

/**
 * @openapi
 * /api/affiliates/{id}/products/{productId}:
 *   delete:
 *     tags: [Affiliates]
 *     summary: Remove product from affiliate (Admin)
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
 *       404:
 *         description: Not found
 */
router.delete("/:id/products/:productId", affiliateController.removeProduct);

// ── Affiliate Settings (Admin) ─────────────────────────────────────────────────

/**
 * @openapi
 * /api/affiliates/settings:
 *   get:
 *     tags: [Affiliates]
 *     summary: Get affiliate settings (Admin)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Affiliate settings
 */
router.get("/settings", affiliateController.getAffiliateSettings);

/**
 * @openapi
 * /api/affiliates/settings:
 *   patch:
 *     tags: [Affiliates]
 *     summary: Update affiliate settings (Admin)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               registrationFee:
 *                 type: number
 *               referralCommissionRate:
 *                 type: number
 *               referralCommissionType:
 *                 type: string
 *                 enum: [percentage, fixed]
 *     responses:
 *       200:
 *         description: Settings updated
 */
router.patch("/settings", affiliateController.updateAffiliateSettings);

export default router;
