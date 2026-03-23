import { Request, Response } from "express";
import { catchAsync } from "../../common/utils/catchAsync";
import { sendSuccess } from "../../common/utils/response";
import { resolve, TOKENS } from "../../di/container";
import { ITestimonialRepository } from "../../domain/interfaces/ITestimonialRepository";

/**
 * Get testimonial repository instance
 */
function getTestimonialRepository(): ITestimonialRepository {
  return resolve<ITestimonialRepository>(TOKENS.ITestimonialRepository);
}

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

    const testimonialRepo = getTestimonialRepository();
    const [{ data, meta }, stats] = await Promise.all([
      testimonialRepo.findAll({ search, status }, page, limit),
      testimonialRepo.getStats(),
    ]);

    sendSuccess(res, { testimonials: data, stats, meta });
  },
);

export const approveTestimonial = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const testimonialRepo = getTestimonialRepository();
    const updated = await testimonialRepo.update(String(req.params.id), {
      status: "approved",
    });
    sendSuccess(res, updated, "Testimonial approved");
  },
);

export const rejectTestimonial = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const testimonialRepo = getTestimonialRepository();
    const updated = await testimonialRepo.update(String(req.params.id), {
      status: "rejected",
    });
    sendSuccess(res, updated, "Testimonial rejected");
  },
);

export const deleteTestimonial = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const testimonialRepo = getTestimonialRepository();
    await testimonialRepo.remove(String(req.params.id));
    sendSuccess(res, null, "Testimonial deleted successfully");
  },
);
