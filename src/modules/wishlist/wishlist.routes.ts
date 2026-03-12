import { Router } from "express";
import { requireAuth } from "../auth/auth.middleware";
import * as wishlistController from "./wishlist.controller";

const router = Router();

router.use(requireAuth);

/**
 * @openapi
 * /api/wishlist:
 *   get:
 *     tags: [Wishlist]
 *     summary: Get user's wishlist
 *     description: Retrieve all items in the user's wishlist. Requires authentication.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of wishlist items
 */
router.get("/", wishlistController.getWishlist);

/**
 * @openapi
 * /api/wishlist:
 *   post:
 *     tags: [Wishlist]
 *     summary: Add to wishlist
 *     description: Add a product to the user's wishlist. Requires authentication.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *             properties:
 *               productId:
 *                 type: string
 *                 format: uuid
 *                 example: 123e4567-e89b-12d3-a456-426614174000
 *     responses:
 *       201:
 *         description: Product added to wishlist
 *       400:
 *         description: Product already in wishlist
 */
router.post("/", wishlistController.addToWishlist);

/**
 * @openapi
 * /api/wishlist/{id}:
 *   delete:
 *     tags: [Wishlist]
 *     summary: Remove from wishlist
 *     description: Remove a product from the user's wishlist. Requires authentication.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Wishlist item ID
 *     responses:
 *       200:
 *         description: Product removed from wishlist
 *       404:
 *         description: Wishlist item not found
 */
router.delete("/:id", wishlistController.removeFromWishlist);

export default router;
