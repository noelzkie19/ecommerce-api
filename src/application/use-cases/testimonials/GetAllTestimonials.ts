/**
 * Get All Testimonials Use Case
 *
 * Lists all testimonials with pagination and optional filters.
 * Intended for admin use.
 */

import { ITestimonialRepository } from "../../../domain/interfaces/ITestimonialRepository";
import { TestimonialFilters } from "../../../domain/entities/Testimonial";
import { resolve, TOKENS } from "../../../di/container";

/**
 * Input DTO for GetAllTestimonialsUseCase
 */
export interface GetAllTestimonialsInput {
  page?: number;
  limit?: number;
  filters?: TestimonialFilters;
}

/**
 * Output DTO for GetAllTestimonialsUseCase
 */
export interface GetAllTestimonialsOutput {
  testimonials: Array<{
    id: string;
    customerName: string;
    location: string | null;
    rating: number;
    message: string;
    status: "pending" | "approved" | "rejected";
    createdAt: string;
    updatedAt: string;
  }>;
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * Get All Testimonials Use Case
 */
export class GetAllTestimonialsUseCase {
  private readonly testimonialRepository: ITestimonialRepository;

  constructor(testimonialRepository?: ITestimonialRepository) {
    this.testimonialRepository =
      testimonialRepository ??
      resolve<ITestimonialRepository>(TOKENS.ITestimonialRepository);
  }

  /**
   * Execute the use case
   */
  async execute(
    input: GetAllTestimonialsInput,
  ): Promise<GetAllTestimonialsOutput> {
    const page = input.page ?? 1;
    const limit = input.limit ?? 10;

    const result = await this.testimonialRepository.findAll(
      input.filters ?? {},
      page,
      limit,
    );

    return {
      testimonials: result.data.map((t) => t.toResponse()),
      meta: result.meta,
    };
  }
}
