/**
 * Courses Public Controller
 *
 * Handles public course endpoints.
 */

import { Request, Response } from "express";
import { catchAsync } from "../../common/utils/catchAsync";
import { sendSuccess } from "../../common/utils/response";
import {
  ListCoursesUseCase,
  GetCourseUseCase,
} from "../../application/use-cases/course";

export const getCourses = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { category, search, isPremium } = req.query as {
      category?: string;
      search?: string;
      isPremium?: string;
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
        isActive: true,
      },
    });

    res.json({ success: true, data: result.courses, meta: result.meta });
  },
);

export const getCourseById = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const id = String(req.params.id);
    const useCase = new GetCourseUseCase();
    const course = await useCase.execute({ courseId: id });

    if (!course) {
      res.status(404).json({ success: false, message: "Course not found" });
      return;
    }

    sendSuccess(res, course);
  },
);
