import { Router } from "express";
import { requireAuth, requireAdmin } from "../auth/auth.middleware";
import * as stockController from "./stocks.controller";

const router = Router();

// public — no auth required
router.get("/:productId", stockController.getStockByProductId);

router.use(requireAuth, requireAdmin);

router.get("/", stockController.getAllStock);
router.patch("/:productId", stockController.updateStock);

export default router;
