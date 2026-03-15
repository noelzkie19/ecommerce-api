import { Router } from "express";
import { requireAuth } from "../auth/auth.middleware";
import * as salesController from "./affiliate-sales.controller";

const router = Router();

// All routes are admin-only
router.use(requireAuth);

/**
 * @openapi
 * /api/affiliate-sales:
 *   get:
 *     tags: [AffiliateSales]
 *     summary: Get all affiliate sales (Admin)
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: affiliateId
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [pending, approved, rejected] }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Paginated affiliate sales
 */
router.get("/", salesController.getSales);

router.get("/:id", salesController.getSale);

router.patch("/:id/status", salesController.updateSaleStatus);
router.patch("/:id/approve", salesController.approveSale);
router.patch("/:id/reject", salesController.rejectSale);
router.delete("/:id", salesController.deleteSale);

export default router;
