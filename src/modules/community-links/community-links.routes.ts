/**
 * Community Links Routes
 *
 * Defines routes for both public and admin endpoints.
 */

import { Router } from "express";
import * as communityLinksController from "./community-links.controller";
import * as communityLinksAdminController from "./community-links.admin.controller";
import { requireAuth } from "../auth/auth.middleware";

const router = Router();

// ---------------------------------------------------------------------------
// Public Routes - List
// ---------------------------------------------------------------------------

/**
 * @openapi
 * /api/community-links:
 *   get:
 *     tags: [Community Links]
 *     summary: List active community links
 *     description: Retrieves a list of active community links for public display.
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [youtube, facebook, telegram, website, discord, instagram, tiktok, twitter, linkedin, other]
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
 *         description: List of community links
 */
router.get("/", communityLinksController.getLinks);

// ---------------------------------------------------------------------------
// Admin Routes (protected) - MUST come before /:id to avoid route conflicts
// ---------------------------------------------------------------------------

/**
 * @openapi
 * /api/community-links/admin:
 *   get:
 *     tags: [Admin - Community Links]
 *     summary: List all community links (admin)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of community links
 *       401:
 *         description: Unauthorized
 */
router.get("/admin", requireAuth, communityLinksAdminController.getLinks);

/**
 * @openapi
 * /api/community-links/admin:
 *   post:
 *     tags: [Admin - Community Links]
 *     summary: Create a new community link
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               url:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *               icon:
 *                 type: string
 *               imageUrl:
 *                 type: string
 *               orderIndex:
 *                 type: integer
 *               isActive:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Community link created
 *       401:
 *         description: Unauthorized
 */
router.post("/admin", requireAuth, communityLinksAdminController.createLink);

/**
 * @openapi
 * /api/community-links/admin/{id}:
 *   patch:
 *     tags: [Admin - Community Links]
 *     summary: Update a community link
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
 *         description: Community link updated
 *       401:
 *         description: Unauthorized
 */
router.patch(
  "/admin/:id",
  requireAuth,
  communityLinksAdminController.updateLink,
);

/**
 * @openapi
 * /api/community-links/admin/{id}:
 *   delete:
 *     tags: [Admin - Community Links]
 *     summary: Delete a community link
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
 *         description: Community link deleted
 *       401:
 *         description: Unauthorized
 */
router.delete(
  "/admin/:id",
  requireAuth,
  communityLinksAdminController.deleteLink,
);

// ---------------------------------------------------------------------------
// Public Routes - Get by ID (must come AFTER /admin routes)
// ---------------------------------------------------------------------------

/**
 * @openapi
 * /api/community-links/{id}:
 *   get:
 *     tags: [Community Links]
 *     summary: Get community link by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Community link details
 *       404:
 *         description: Community link not found
 */
router.get("/:id", communityLinksController.getLinkById);

export default router;
