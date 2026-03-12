import { Router } from "express";
import { requireAuth } from "../auth/auth.middleware";
import * as usersController from "./users.controller";

const router = Router();

router.use(requireAuth);

/**
 * @openapi
 * /api/users/me:
 *   get:
 *     tags: [Users]
 *     summary: Get current user profile
 *     description: Retrieve the authenticated user's profile. Requires authentication.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile data
 */
router.get("/me", usersController.getProfile);

/**
 * @openapi
 * /api/users/me:
 *   patch:
 *     tags: [Users]
 *     summary: Update current user profile
 *     description: Update the authenticated user's profile. Requires authentication.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *                 example: John Doe
 *               phoneNumber:
 *                 type: string
 *                 example: +639123456789
 *               address:
 *                 type: string
 *                 example: 123 Main St, Manila
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */
router.patch("/me", usersController.updateProfile);

export default router;
