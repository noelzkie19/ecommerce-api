/**
 * Courses Routes
 *
 * Defines all course-related routes.
 */

import { Router } from "express";
import * as coursesController from "./courses.controller";
import * as coursesAdminController from "./courses.admin.controller";

const router = Router();

// Public routes
router.get("/courses", coursesController.getCourses);
router.get("/courses/:id", coursesController.getCourseById);

// Admin routes
router.get("/admin/courses", coursesAdminController.getCourses);
router.post("/admin/courses", coursesAdminController.createCourse);
router.put("/admin/courses/:id", coursesAdminController.updateCourse);
router.delete("/admin/courses/:id", coursesAdminController.deleteCourse);

export default router;
