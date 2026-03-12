import { Router } from "express";
import { optionalAuth } from "../auth/auth.middleware";
import * as cartController from "./cart.controller";

const router = Router();

// Attaches req.user if a valid token is present, but does not block guests
router.use(optionalAuth);

/**
 * @openapi
 * /api/cart:
 *   get:
 *     tags: [Cart]
 *     summary: Get user's cart
 *     description: Retrieve the cart items for the authenticated user or guest.
 *     parameters:
 *       - in: header
 *         name: x-guest-id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Guest ID (required for guest cart)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart items retrieved successfully
 */
router.get("/", cartController.getCart);

/**
 * @openapi
 * /api/cart:
 *   post:
 *     tags: [Cart]
 *     summary: Add item to cart
 *     description: Add a product to the cart. Supports both authenticated users and guests.
 *     parameters:
 *       - in: header
 *         name: x-guest-id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Guest ID (required for guest cart)
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
 *               quantity:
 *                 type: integer
 *                 default: 1
 *                 minimum: 1
 *                 example: 2
 *     responses:
 *       201:
 *         description: Item added to cart
 *       400:
 *         description: Validation error
 */
router.post("/", cartController.addToCart);

/**
 * @openapi
 * /api/cart/{id}:
 *   patch:
 *     tags: [Cart]
 *     summary: Update cart item quantity
 *     description: Update the quantity of a specific cart item.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Cart item ID
 *       - in: header
 *         name: x-guest-id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Guest ID (required for guest cart)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - quantity
 *             properties:
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *                 example: 3
 *     responses:
 *       200:
 *         description: Cart item updated
 *       400:
 *         description: Invalid quantity
 */
router.patch("/:id", cartController.updateCartItem);

/**
 * @openapi
 * /api/cart/{id}:
 *   delete:
 *     tags: [Cart]
 *     summary: Remove item from cart
 *     description: Remove a specific item from the cart.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Cart item ID
 *       - in: header
 *         name: x-guest-id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Guest ID (required for guest cart)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Item removed from cart
 */
router.delete("/:id", cartController.removeFromCart);

/**
 * @openapi
 * /api/cart:
 *   delete:
 *     tags: [Cart]
 *     summary: Clear cart
 *     description: Remove all items from the cart.
 *     parameters:
 *       - in: header
 *         name: x-guest-id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Guest ID (required for guest cart)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart cleared
 */
router.delete("/", cartController.clearCart);

export default router;
