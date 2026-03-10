import { Router } from "express";
import multer from "multer";
import * as productsController from "./products.controller";
import * as productsAdminController from "./products.admin.controller";
import * as productsUploadController from "./products.upload.controller";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// ---------------------------------------------------------------------------
// Admin – file upload
// ---------------------------------------------------------------------------

// Single image (backwards-compat)
router.post(
  "/admin/upload-image",
  upload.single("image"),
  productsUploadController.uploadImage,
);

// Multiple images at once (up to 10) → returns { urls: string[] }
router.post(
  "/admin/upload-images",
  upload.array("images", 10),
  productsUploadController.uploadImages,
);

// ---------------------------------------------------------------------------
// Admin – product images CRUD  (must be before /:id to avoid route conflicts)
// ---------------------------------------------------------------------------

// Add images to a product (append)
router.post("/:id/images", productsAdminController.addProductImages);

// Replace all images for a product
router.put("/:id/images", productsAdminController.replaceProductImages);

// Reorder images
router.patch(
  "/:id/images/reorder",
  productsAdminController.reorderProductImages,
);

// Delete a single image by its own id
router.delete("/images/:imageId", productsAdminController.deleteProductImage);

// ---------------------------------------------------------------------------
// Admin – products CRUD  (must be before public /:id)
// ---------------------------------------------------------------------------

router.get("/admin", productsAdminController.getProducts);
router.post("/", productsAdminController.createProduct);
router.patch("/:id", productsAdminController.updateProduct);
router.delete("/:id", productsAdminController.deleteProduct);

// ---------------------------------------------------------------------------
// Public
// ---------------------------------------------------------------------------

router.get("/", productsController.getProducts);
router.get("/:id", productsController.getProductById);

export default router;
