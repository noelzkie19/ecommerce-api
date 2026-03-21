/**
 * Get Approved Testimonials Use Case
 *
 * Lists publicly visible approved testimonials with pagination.
 */

import { ITestimonialRepository } from "../../../domain/interfaces/ITestimonialRepository";
import { TestimonialResponse } from "../../../domain/entities/Testimonial";
import { resolve, TOKENS } from "../../../di/container";

/**
 * Input DTO for GetApprovedTestimonialsUseCase
 */
export interface GetApprovedTestimonialsInput {
  page?: number;
  limit?: number;
}

/**
 * Output DTO for GetApprovedTestimonialsUseCase
 */
export interface GetApprovedTestimonialsOutput {
  testimonials: TestimonialResponse[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * Get Approved Testimonials Use Case
 */
export class GetApprovedTestimonialsUseCase {
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
    input: GetApprovedTestimonialsInput,
  ): Promise<GetApprovedTestimonialsOutput> {
    const page = input.page ?? 1;
    const limit = input.limit ?? 10;

    const result = await this.testimonialRepository.findAllApproved(
      page,
      limit,
    );

    return {
      testimonials: result.data.map((t) => t.toResponse()),
      meta: result.meta,
    };
  }
}
