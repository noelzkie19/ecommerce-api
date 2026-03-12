import { Router } from "express";
import multer from "multer";
import * as productsController from "./products.controller";
import * as productsAdminController from "./products.admin.controller";
import * as productsUploadController from "./products.upload.controller";
import { requireAdmin, requireAuth } from "../auth/auth.middleware";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// ---------------------------------------------------------------------------
// Admin – file upload
// ---------------------------------------------------------------------------

/**
 * @openapi
 * /api/products/admin/upload-image:
 *   post:
 *     tags: [Products]
 *     summary: Upload single product image (Admin)
 *     description: Upload a single image for a product. Requires admin authentication.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - image
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Image uploaded successfully
 *       401:
 *         description: Unauthorized
 */
router.post(
  "/admin/upload-image",
  requireAdmin,
  upload.single("image"),
  productsUploadController.uploadImage,
);

/**
 * @openapi
 * /api/products/admin/upload-images:
 *   post:
 *     tags: [Products]
 *     summary: Upload multiple product images (Admin)
 *     description: Upload up to 10 images at once. Requires admin authentication.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - images
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Images uploaded successfully
 *       401:
 *         description: Unauthorized
 */
router.post(
  "/admin/upload-images",
  requireAdmin,
  upload.array("images", 10),
  productsUploadController.uploadImages,
);

// ---------------------------------------------------------------------------
// Admin – product images CRUD  (must be before /:id to avoid route conflicts)
// ---------------------------------------------------------------------------

/**
 * @openapi
 * /api/products/{id}/images:
 *   post:
 *     tags: [Products]
 *     summary: Add images to product (Admin)
 *     description: Append new images to a product. Requires admin authentication.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               imageUrls:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Images added
 */
router.post(
  "/:id/images",
  requireAuth,
  requireAdmin,
  productsAdminController.addProductImages,
);

/**
 * @openapi
 * /api/products/{id}/images:
 *   put:
 *     tags: [Products]
 *     summary: Replace all product images (Admin)
 *     description: Replace all images for a product. Requires admin authentication.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               imageUrls:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Images replaced
 */
router.put(
  "/:id/images",
  requireAuth,
  requireAdmin,
  productsAdminController.replaceProductImages,
);

/**
 * @openapi
 * /api/products/{id}/images/reorder:
 *   patch:
 *     tags: [Products]
 *     summary: Reorder product images (Admin)
 *     description: Reorder images for a product. Requires admin authentication.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               imageIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Images reordered
 */
router.patch(
  "/:id/images/reorder",
  requireAuth,
  requireAdmin,
  productsAdminController.reorderProductImages,
);

/**
 * @openapi
 * /api/products/images/{imageId}:
 *   delete:
 *     tags: [Products]
 *     summary: Delete product image (Admin)
 *     description: Delete a single image by its ID. Requires admin authentication.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: imageId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Image ID
 *     responses:
 *       200:
 *         description: Image deleted
 */
router.delete(
  "/images/:imageId",
  requireAuth,
  requireAdmin,
  productsAdminController.deleteProductImage,
);

// ---------------------------------------------------------------------------
// Admin – products CRUD  (must be before public /:id)
// ---------------------------------------------------------------------------

/**
 * @openapi
 * /api/products/admin:
 *   get:
 *     tags: [Products]
 *     summary: Get all products (Admin)
 *     description: Retrieve all products with filtering. Requires admin authentication.
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
 *           default: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: List of products
 */
router.get(
  "/admin",
  requireAuth,
  requireAdmin,
  productsAdminController.getProducts,
);

/**
 * @openapi
 * /api/products:
 *   post:
 *     tags: [Products]
 *     summary: Create product (Admin)
 *     description: Create a new product. Requires admin authentication.
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
 *               - price
 *               - category
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               category:
 *                 type: string
 *               stock:
 *                 type: integer
 *               imageUrl:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *               affiliateLink:
 *                 type: string
 *                 nullable: true
 *                 description: Optional external affiliate / referral URL
 *     responses:
 *       201:
 *         description: Product created
 */
router.post(
  "/",
  requireAuth,
  requireAdmin,
  productsAdminController.createProduct,
);

/**
 * @openapi
 * /api/products/{id}:
 *   patch:
 *     tags: [Products]
 *     summary: Update product (Admin)
 *     description: Update product details. Requires admin authentication.
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
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               category:
 *                 type: string
 *               stock:
 *                 type: integer
 *               isActive:
 *                 type: boolean
 *               affiliateLink:
 *                 type: string
 *                 nullable: true
 *                 description: Optional external affiliate / referral URL
 *     responses:
 *       200:
 *         description: Product updated
 */
router.patch(
  "/:id",
  requireAuth,
  requireAdmin,
  productsAdminController.updateProduct,
);

/**
 * @openapi
 * /api/products/{id}:
 *   delete:
 *     tags: [Products]
 *     summary: Delete product (Admin)
 *     description: Delete a product. Requires admin authentication.
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
 *         description: Product deleted
 */
router.delete(
  "/:id",
  requireAuth,
  requireAdmin,
  productsAdminController.deleteProduct,
);

// ---------------------------------------------------------------------------
// Public
// ---------------------------------------------------------------------------

/**
 * @openapi
 * /api/products:
 *   get:
 *     tags: [Products]
 *     summary: Get all products (Public)
 *     description: Retrieve available products with optional filtering.
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
 *           default: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of products
 */
router.get("/", productsController.getProducts);

/**
 * @openapi
 * /api/products/{id}:
 *   get:
 *     tags: [Products]
 *     summary: Get product by ID (Public)
 *     description: Retrieve a specific product by ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Product details
 *       404:
 *         description: Product not found
 */
router.get("/:id", productsController.getProductById);

export default router;
