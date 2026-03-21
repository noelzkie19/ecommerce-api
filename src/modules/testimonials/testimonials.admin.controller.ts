import { Request, Response } from "express";
import { catchAsync } from "../../common/utils/catchAsync";
import { sendSuccess } from "../../common/utils/response";
import {
  GetAllTestimonialsUseCase,
  GetTestimonialStatsUseCase,
  UpdateTestimonialStatusUseCase,
  DeleteTestimonialUseCase,
} from "../../application/use-cases/testimonials";
import { TestimonialFilters } from "../../domain/entities/Testimonial";

export const getAllTestimonials = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const search = req.query.search as string | undefined;
    const status = req.query.status as TestimonialFilters["status"];
    const page = Math.max(1, Number.parseInt(req.query.page as string) || 1);
    const limit = Math.min(
      100,
      Math.max(1, Number.parseInt(req.query.limit as string) || 10),
    );

    const [result, stats] = await Promise.all([
      new GetAllTestimonialsUseCase().execute({
        filters: { search, status },
        page,
        limit,
      }),
      new GetTestimonialStatsUseCase().execute(),
    ]);

    sendSuccess(res, { testimonials: result.testimonials, stats, meta: result.meta });
  },
);

export const approveTestimonial = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const useCase = new UpdateTestimonialStatusUseCase();
    const updated = await useCase.execute({
      id: String(req.params.id),
      status: "approved",
    });
    sendSuccess(res, updated, "Testimonial approved");
  },
);

export const rejectTestimonial = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const useCase = new UpdateTestimonialStatusUseCase();
    const updated = await useCase.execute({
      id: String(req.params.id),
      status: "rejected",
    });
    sendSuccess(res, updated, "Testimonial rejected");
  },
);

export const deleteTestimonial = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const useCase = new DeleteTestimonialUseCase();
    await useCase.execute({ id: String(req.params.id) });
    sendSuccess(res, null, "Testimonial deleted successfully");
  },
);

