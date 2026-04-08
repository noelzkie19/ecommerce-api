/**
 * Courses Admin Controller
 *
 * Handles admin course management endpoints.
 */

import { Request, Response } from "express";
import { catchAsync } from "../../common/utils/catchAsync";
import {
  ListCoursesUseCase,
  CreateCourseUseCase,
  UpdateCourseUseCase,
  DeleteCourseUseCase,
} from "../../application/use-cases/course";

// ---------------------------------------------------------------------------
// Courses
// ---------------------------------------------------------------------------

export const getCourses = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { category, search, isPremium, isActive } = req.query as {
      category?: string;
      search?: string;
      isPremium?: string;
      isActive?: string;
    };
    const page = Math.max(1, Number.parseInt(req.query.page as string) || 1);
    const limit = Math.min(
      100,
      Math.max(1, Number.parseInt(req.query.limit as string) || 10),
    );

    const parseBoolean = (value?: string): boolean | undefined => {
      if (value === "true") return true;
      if (value === "false") return false;
      return undefined;
    };

    const useCase = new ListCoursesUseCase();
    const result = await useCase.execute({
      page,
      limit,
      filters: {
        category,
        search,
        isPremium: parseBoolean(isPremium),
        isActive: parseBoolean(isActive),
      },
    });

    res.json({ success: true, data: result.courses, meta: result.meta });
  },
);

export const createCourse = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const useCase = new CreateCourseUseCase();
    const course = await useCase.execute(req.body);
    res.status(201).json({ success: true, data: course });
  },
);

export const updateCourse = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const id = String(req.params.id);
    const useCase = new UpdateCourseUseCase();
    const course = await useCase.execute({ courseId: id, ...req.body });
    res.json({ success: true, data: course });
  },
);

export const deleteCourse = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const id = String(req.params.id);
    const useCase = new DeleteCourseUseCase();
    await useCase.execute({ courseId: id });
    res.status(204).send();
  },
);
