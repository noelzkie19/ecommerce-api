import { Request, Response } from "express";
import { catchAsync } from "../../common/utils/catchAsync";
import { sendSuccess } from "../../common/utils/response";
import * as testimonialService from "./testimonials.service";
import { TestimonialStatus } from "./testimonials.type";

export const getAllTestimonials = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const search = req.query.search as string | undefined;
    const status = req.query.status as TestimonialStatus | undefined;
    const page = Math.max(1, Number.parseInt(req.query.page as string) || 1);
    const limit = Math.min(
      100,
      Math.max(1, Number.parseInt(req.query.limit as string) || 10),
    );

    const [{ data, meta }, stats] = await Promise.all([
      testimonialService.getAllTestimonials(search, status, page, limit),
      testimonialService.getTestimonialStats(),
    ]);

    sendSuccess(res, { testimonials: data, stats, meta });
  },
);

export const approveTestimonial = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const updated = await testimonialService.approveTestimonial(
      String(req.params.id),
    );
    sendSuccess(res, updated, "Testimonial approved");
  },
);

export const rejectTestimonial = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const updated = await testimonialService.rejectTestimonial(
      String(req.params.id),
    );
    sendSuccess(res, updated, "Testimonial rejected");
  },
);

export const deleteTestimonial = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    await testimonialService.deleteTestimonial(String(req.params.id));
    sendSuccess(res, null, "Testimonial deleted successfully");
  },
);
