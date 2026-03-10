import { Router } from "express";
import { optionalAuth } from "../auth/auth.middleware";
import * as cartController from "./cart.controller";

const router = Router();

// Attaches req.user if a valid token is present, but does not block guests
router.use(optionalAuth);

router.get("/", cartController.getCart);
router.post("/", cartController.addToCart);
router.patch("/:id", cartController.updateCartItem);
router.delete("/:id", cartController.removeFromCart);
router.delete("/", cartController.clearCart);

export default router;
