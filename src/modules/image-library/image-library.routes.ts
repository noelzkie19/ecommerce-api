/**
 * Image Library Routes
 *
 * Defines routes for both public and admin endpoints.
 */

import { Router } from "express";
import * as imageLibraryController from "./image-library.controller";
import * as imageLibraryAdminController from "./image-library.admin.controller";
import { requireAuth } from "../auth/auth.middleware";

const router = Router();

// ---------------------------------------------------------------------------
// Public Routes - List
// ---------------------------------------------------------------------------

/**
 * @openapi
 * /api/image-library:
 *   get:
 *     tags: [Image Library]
 *     summary: List active image library items
 *     description: Retrieves a list of active image library items for public display.
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [banners, gallery, testimonials, partners]
 *         description: Filter by category
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in title and description
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: List of image library items
 */
router.get("/", imageLibraryController.getImages);

// ---------------------------------------------------------------------------
// Admin Routes (protected) - MUST come before /:id to avoid route conflicts
// ---------------------------------------------------------------------------

/**
 * @openapi
 * /api/image-library/admin:
 *   get:
 *     tags: [Admin - Image Library]
 *     summary: List all image library items (admin)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of image library items
 *       401:
 *         description: Unauthorized
 */
router.get("/admin", requireAuth, imageLibraryAdminController.getImages);

/**
 * @openapi
 * /api/image-library/admin:
 *   post:
 *     tags: [Admin - Image Library]
 *     summary: Create a new image library item
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - imageUrl
 *             properties:
 *               title:
 *                 type: string
 *               category:
 *                 type: string
 *                 enum: [banners, gallery, testimonials, partners]
 *               thumbnailUrl:
 *                 type: string
 *               imageUrl:
 *                 type: string
 *               description:
 *                 type: string
 *               displayOrder:
 *                 type: integer
 *               isActive:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Image library item created
 *       401:
 *         description: Unauthorized
 */
router.post("/admin", requireAuth, imageLibraryAdminController.createImage);

/**
 * @openapi
 * /api/image-library/admin/{id}:
 *   patch:
 *     tags: [Admin - Image Library]
 *     summary: Update an image library item
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
 *         description: Image library item updated
 *       401:
 *         description: Unauthorized
 */
router.patch(
  "/admin/:id",
  requireAuth,
  imageLibraryAdminController.updateImage,
);

/**
 * @openapi
 * /api/image-library/admin/{id}:
 *   delete:
 *     tags: [Admin - Image Library]
 *     summary: Delete an image library item
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
 *         description: Image library item deleted
 *       401:
 *         description: Unauthorized
 */
router.delete(
  "/admin/:id",
  requireAuth,
  imageLibraryAdminController.deleteImage,
);

// ---------------------------------------------------------------------------
// Public Routes - Get by ID (must come AFTER /admin routes)
// ---------------------------------------------------------------------------

/**
 * @openapi
 * /api/image-library/{id}:
 *   get:
 *     tags: [Image Library]
 *     summary: Get image library item by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Image library item details
 *       404:
 *         description: Image library item not found
 */
router.get("/:id", imageLibraryController.getImageById);

export default router;
