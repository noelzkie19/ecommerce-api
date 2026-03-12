import { Router } from "express";
import { requireAuth, requireAdmin } from "../auth/auth.middleware";
import * as publicController from "./testimonials.public.controller";
import * as adminController from "./testimonials.admin.controller";

const router = Router();

// ── Public: no auth required ─────────────────────────────────────────────────-

/**
 * @openapi
 * /api/testimonials:
 *   get:
 *     tags: [Testimonials]
 *     summary: Get approved testimonials
 *     description: Retrieve all approved testimonials. Public endpoint.
 *     responses:
 *       200:
 *         description: List of approved testimonials
 */
router.get("/", publicController.getApprovedTestimonials);

/**
 * @openapi
 * /api/testimonials:
 *   post:
 *     tags: [Testimonials]
 *     summary: Submit a testimonial
 *     description: Submit a new testimonial. Requires authentication.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 example: Great product, highly recommended!
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 5
 *     responses:
 *       201:
 *         description: Testimonial submitted successfully
 *       400:
 *         description: Validation error
 */
router.post("/", requireAuth, publicController.submitTestimonial);

// ── Admin: approve / reject / delete ─────────────────────────────────────────

/**
 * @openapi
 * /api/testimonials/admin/all:
 *   get:
 *     tags: [Testimonials]
 *     summary: Get all testimonials (Admin)
 *     description: Retrieve all testimonials including pending. Requires admin authentication.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all testimonials
 */
router.get(
  "/admin/all",
  requireAuth,
  requireAdmin,
  adminController.getAllTestimonials,
);

/**
 * @openapi
 * /api/testimonials/admin/{id}/approve:
 *   patch:
 *     tags: [Testimonials]
 *     summary: Approve testimonial (Admin)
 *     description: Approve a testimonial. Requires admin authentication.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Testimonial ID
 *     responses:
 *       200:
 *         description: Testimonial approved
 */
router.patch(
  "/admin/:id/approve",
  requireAuth,
  requireAdmin,
  adminController.approveTestimonial,
);

/**
 * @openapi
 * /api/testimonials/admin/{id}/reject:
 *   patch:
 *     tags: [Testimonials]
 *     summary: Reject testimonial (Admin)
 *     description: Reject a testimonial. Requires admin authentication.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Testimonial ID
 *     responses:
 *       200:
 *         description: Testimonial rejected
 */
router.patch(
  "/admin/:id/reject",
  requireAuth,
  requireAdmin,
  adminController.rejectTestimonial,
);

/**
 * @openapi
 * /api/testimonials/admin/{id}:
 *   delete:
 *     tags: [Testimonials]
 *     summary: Delete testimonial (Admin)
 *     description: Delete a testimonial. Requires admin authentication.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Testimonial ID
 *     responses:
 *       200:
 *         description: Testimonial deleted
 */
router.delete(
  "/admin/:id",
  requireAuth,
  requireAdmin,
  adminController.deleteTestimonial,
);

export default router;
