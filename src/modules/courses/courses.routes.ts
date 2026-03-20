/**
 * Courses Routes
 *
 * Defines all course-related routes.
 */

import { Router } from "express";
import * as coursesController from "./courses.controller";
import * as coursesAdminController from "./courses.admin.controller";
import { requireAuth } from "../auth/auth.middleware";

const router = Router();

// ── Public Routes ────────────────────────────────────────────────────────────────

/**
 * @openapi
 * /api/courses:
 *   get:
 *     tags: [Courses]
 *     summary: List all courses
 *     parameters:
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
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of courses
 */
router.get("/", coursesController.getCourses);

// ── Admin Routes (protected) - MUST come before /:id to avoid route conflicts ──

/**
 * @openapi
 * /api/courses/admin:
 *   get:
 *     tags: [Admin - Courses]
 *     summary: List all courses (admin)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of courses
 *       401:
 *         description: Unauthorized
 */
router.get("/admin", requireAuth, coursesAdminController.getCourses);

/**
 * @openapi
 * /api/courses/admin:
 *   post:
 *     tags: [Admin - Courses]
 *     summary: Create a new course
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
 *               description:
 *                 type: string
 *               youtube_url:
 *                 type: string
 *               category:
 *                 type: string
 *     responses:
 *       201:
 *         description: Course created
 *       401:
 *         description: Unauthorized
 */
router.post("/admin", requireAuth, coursesAdminController.createCourse);

/**
 * @openapi
 * /api/courses/admin/{id}:
 *   put:
 *     tags: [Admin - Courses]
 *     summary: Update a course
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
 *         description: Course updated
 *       401:
 *         description: Unauthorized
 */
router.put("/admin/:id", requireAuth, coursesAdminController.updateCourse);

/**
 * @openapi
 * /api/courses/admin/{id}:
 *   delete:
 *     tags: [Admin - Courses]
 *     summary: Delete a course
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
 *         description: Course deleted
 *       401:
 *         description: Unauthorized
 */
router.delete("/admin/:id", requireAuth, coursesAdminController.deleteCourse);

// ── Public Routes - Get by ID (must come AFTER /admin routes) ─────────────────

/**
 * @openapi
 * /api/courses/{id}:
 *   get:
 *     tags: [Courses]
 *     summary: Get course by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Course details
 *       404:
 *         description: Course not found
 */
router.get("/:id", coursesController.getCourseById);

export default router;
