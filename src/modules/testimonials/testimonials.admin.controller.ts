/**
 * Testimonials Admin Controller
 *
 * Handles HTTP requests for admin testimonial endpoints.
 */

import { Request, Response } from "express";
import { catchAsync } from "../../common/utils/catchAsync";
import { sendSuccess } from "../../common/utils/response";
import {
  ListAllTestimonialsUseCase,
  UpdateTestimonialUseCase,
  DeleteTestimonialUseCase,
} from "../../application/use-cases/testimonial";

export const getAllTestimonials = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const search = req.query.search as string | undefined;
    const status = req.query.status as
      | "pending"
      | "approved"
      | "rejected"
      | undefined;
    const page = Math.max(1, Number.parseInt(req.query.page as string) || 1);
    const limit = Math.min(
      100,
      Math.max(1, Number.parseInt(req.query.limit as string) || 10),
    );

    const listAllTestimonialsUseCase = new ListAllTestimonialsUseCase();
    const result = await listAllTestimonialsUseCase.execute({
      page,
      limit,
      search,
      status,
    });

    sendSuccess(res, { testimonials: result.data, meta: result.meta });
  },
);

export const approveTestimonial = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const id = String(req.params.id);

    const updateTestimonialUseCase = new UpdateTestimonialUseCase();
    const updated = await updateTestimonialUseCase.execute({
      testimonialId: id,
      status: "approved",
    });

    sendSuccess(res, updated, "Testimonial approved");
  },
);

export const rejectTestimonial = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const id = String(req.params.id);

    const updateTestimonialUseCase = new UpdateTestimonialUseCase();
    const updated = await updateTestimonialUseCase.execute({
      testimonialId: id,
      status: "rejected",
    });

    sendSuccess(res, updated, "Testimonial rejected");
  },
);

export const deleteTestimonial = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const id = String(req.params.id);

    const deleteTestimonialUseCase = new DeleteTestimonialUseCase();
    await deleteTestimonialUseCase.execute({ testimonialId: id });

    sendSuccess(res, null, "Testimonial deleted successfully");
  },
);
