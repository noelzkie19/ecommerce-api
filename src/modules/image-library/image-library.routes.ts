/**
 * Image Library Routes
 *
 * Defines routes for both public and admin endpoints.
 */

import { Router } from "express";
import multer from "multer";
import * as imageLibraryController from "./image-library.controller";
import * as imageLibraryAdminController from "./image-library.admin.controller";
import * as imageLibraryUploadController from "./image-library.upload.controller";
import { requireAuth, requireAdmin } from "../auth/auth.middleware";

// Public router - mounted at /api/image-library
const router = Router();
// Admin router - mounted at /api/admin/image-library
const adminRouter = Router();

const upload = multer({ storage: multer.memoryStorage() });

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
// Public Routes - Download (must come BEFORE /:id to avoid route conflicts)
// ---------------------------------------------------------------------------

/**
 * @openapi
 * /api/image-library/{id}/download:
 *   get:
 *     tags: [Image Library]
 *     summary: Download image by ID
 *     description: Downloads the image file from the image library.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Image file downloaded
 *       404:
 *         description: Image not found
 */
router.get("/:id/download", imageLibraryController.downloadImage);

// ---------------------------------------------------------------------------
// Public Routes - Get by ID
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

// ---------------------------------------------------------------------------
// Admin Routes (mounted at /api/admin/image-library)
// ---------------------------------------------------------------------------

/**
 * @openapi
 * /api/admin/image-library:
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
adminRouter.get("/", requireAuth, imageLibraryAdminController.getImages);

/**
 * @openapi
 * /api/admin/image-library:
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
adminRouter.post("/", requireAuth, imageLibraryAdminController.createImage);

/**
 * @openapi
 * /api/admin/image-library/upload:
 *   post:
 *     tags: [Admin - Image Library]
 *     summary: Upload image and thumbnail
 *     security:
 *       - bearerAuth: []
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: formData
 *         name: image
 *         required: true
 *         type: file
 *         description: Main image file (JPEG, PNG, WEBP, GIF)
 *       - in: formData
 *         name: thumbnail
 *         required: false
 *         type: file
 *         description: Thumbnail image file (JPEG, PNG, WEBP, GIF)
 *     responses:
 *       201:
 *         description: Images uploaded successfully
 *       401:
 *         description: Unauthorized
 */
adminRouter.post(
  "/upload",
  requireAuth,
  requireAdmin,
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "file", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 },
  ]),
  imageLibraryUploadController.uploadImageAndThumbnailHandler,
);

/**
 * @openapi
 * /api/admin/image-library/upload-image:
 *   post:
 *     tags: [Admin - Image Library]
 *     summary: Upload main image
 *     security:
 *       - bearerAuth: []
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: formData
 *         name: image
 *         required: true
 *         type: file
 *         description: Image file (JPEG, PNG, WEBP, GIF)
 *     responses:
 *       201:
 *         description: Image uploaded successfully
 *       401:
 *         description: Unauthorized
 */
adminRouter.post(
  "/upload-image",
  requireAuth,
  requireAdmin,
  upload.single("image"),
  imageLibraryUploadController.uploadImageHandler,
);

/**
 * @openapi
 * /api/admin/image-library/upload-thumbnail:
 *   post:
 *     tags: [Admin - Image Library]
 *     summary: Upload thumbnail
 *     security:
 *       - bearerAuth: []
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: formData
 *         name: thumbnail
 *         required: true
 *         type: file
 *         description: Thumbnail file (JPEG, PNG, WEBP, GIF)
 *     responses:
 *       201:
 *         description: Thumbnail uploaded successfully
 *       401:
 *         description: Unauthorized
 */
adminRouter.post(
  "/upload-thumbnail",
  requireAuth,
  requireAdmin,
  upload.single("thumbnail"),
  imageLibraryUploadController.uploadThumbnailHandler,
);

/**
 * @openapi
 * /api/admin/image-library/{id}:
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
adminRouter.patch("/:id", requireAuth, imageLibraryAdminController.updateImage);

/**
 * @openapi
 * /api/admin/image-library/{id}:
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
adminRouter.delete(
  "/:id",
  requireAuth,
  imageLibraryAdminController.deleteImage,
);

// Export both routers
export default router;
export { adminRouter };
