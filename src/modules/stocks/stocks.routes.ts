import { Router } from "express";
import { requireAuth, requireAdmin } from "../auth/auth.middleware";
import * as stockController from "./stocks.controller";

const router = Router();

// Public endpoint - no authentication required for stock availability
router.get("/availability/:productId", stockController.getStockAvailability);

// All other routes require authentication and admin privileges
router.use(requireAuth, requireAdmin);

/**
 * @openapi
 * /api/stocks:
 *   get:
 *     tags: [Stocks]
 *     summary: Get all stock (Admin)
 *     description: Retrieve all stock information. Requires admin authentication.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all stock
 */
router.get("/", stockController.getAllStock);

/**
 * @openapi
 * /api/stocks/{productId}:
 *   get:
 *     tags: [Stocks]
 *     summary: Get stock by product ID
 *     description: Retrieve stock information for a specific product. Requires admin authentication.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Stock information
 *       404:
 *         description: Stock not found
 */
router.get("/:productId", stockController.getStockByProductId);

/**
 * @openapi
 * /api/stocks/{productId}:
 *   patch:
 *     tags: [Stocks]
 *     summary: Update stock quantity (Admin)
 *     description: Update the stock quantity for a product. Requires admin authentication.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
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
 *             required:
 *               - quantity
 *             properties:
 *               quantity:
 *                 type: integer
 *                 example: 100
 *     responses:
 *       200:
 *         description: Stock updated
 */
router.patch("/:productId", stockController.updateStock);

export default router;
