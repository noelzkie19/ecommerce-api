/**
 * Testimonials Public Controller
 *
 * Handles HTTP requests for public testimonial endpoints.
 */

import { Request, Response } from "express";
import { catchAsync } from "../../common/utils/catchAsync";
import { sendSuccess } from "../../common/utils/response";
import { AppError } from "../../common/utils/AppError";
import {
  ListTestimonialsUseCase,
  CreateTestimonialUseCase,
} from "../../application/use-cases/testimonial";

export const getApprovedTestimonials = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const page = Math.max(1, Number.parseInt(req.query.page as string) || 1);
    const limit = Math.min(
      100,
      Math.max(1, Number.parseInt(req.query.limit as string) || 10),
    );

    const listTestimonialsUseCase = new ListTestimonialsUseCase();
    const result = await listTestimonialsUseCase.execute({ page, limit });

    sendSuccess(res, result);
  },
);

export const submitTestimonial = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { customerName, location, rating, message } = req.body;

    if (!customerName) throw new AppError("customerName is required", 400);
    if (!rating) throw new AppError("rating is required", 400);
    if (!message) throw new AppError("message is required", 400);

    const createTestimonialUseCase = new CreateTestimonialUseCase();
    const created = await createTestimonialUseCase.execute({
      customerName,
      location,
      rating: Number(rating),
      message,
    });

    sendSuccess(res, created, "Testimonial submitted successfully", 201);
  },
);
