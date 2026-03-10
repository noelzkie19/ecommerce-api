import { Router } from "express";
import { requireAuth, requireAdmin } from "../auth/auth.middleware";
import * as publicController from "./testimonials.public.controller";
import * as adminController from "./testimonials.admin.controller";

const router = Router();

// ── Public: no auth required ──────────────────────────────────────────────────
router.get("/", publicController.getApprovedTestimonials);
router.post("/", publicController.submitTestimonial);

// ── Admin: approve / reject / delete ─────────────────────────────────────────
router.get(
  "/admin/all",
  requireAuth,
  requireAdmin,
  adminController.getAllTestimonials,
);
router.patch(
  "/admin/:id/approve",
  requireAuth,
  requireAdmin,
  adminController.approveTestimonial,
);
router.patch(
  "/admin/:id/reject",
  requireAuth,
  requireAdmin,
  adminController.rejectTestimonial,
);
router.delete(
  "/admin/:id",
  requireAuth,
  requireAdmin,
  adminController.deleteTestimonial,
);

export default router;
