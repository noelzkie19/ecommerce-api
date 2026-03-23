import { Request, Response } from "express";
import { catchAsync } from "../../common/utils/catchAsync";
import { sendSuccess } from "../../common/utils/response";
import { AppError } from "../../common/utils/AppError";
import { resolve, TOKENS } from "../../di/container";
import { ITestimonialRepository } from "../../domain/interfaces/ITestimonialRepository";

/**
 * Get testimonial repository instance
 */
function getTestimonialRepository(): ITestimonialRepository {
  return resolve<ITestimonialRepository>(TOKENS.ITestimonialRepository);
}

export const getApprovedTestimonials = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const page = Math.max(1, Number.parseInt(req.query.page as string) || 1);
    const limit = Math.min(
      100,
      Math.max(1, Number.parseInt(req.query.limit as string) || 10),
    );
    const testimonialRepo = getTestimonialRepository();
    const result = await testimonialRepo.findAllApproved(page, limit);
    sendSuccess(res, result);
  },
);

export const submitTestimonial = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { customerName, location, rating, message } = req.body;

    if (!customerName) throw new AppError("customerName is required", 400);
    if (!rating) throw new AppError("rating is required", 400);
    if (!message) throw new AppError("message is required", 400);

    const testimonialRepo = getTestimonialRepository();
    const created = await testimonialRepo.create({
      customerName,
      location: location ?? null,
      rating: Number(rating),
      message,
    });
    sendSuccess(res, created, "Testimonial submitted successfully", 201);
  },
);
