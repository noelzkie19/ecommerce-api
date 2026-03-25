/**
 * List Testimonials Use Case (Public)
 *
 * Retrieves all approved testimonials for public display.
 */

import { ITestimonialRepository } from "../../../domain/interfaces/ITestimonialRepository";
import { resolve, TOKENS } from "../../../di/container";

/**
 * Input DTO for ListTestimonialsUseCase
 */
export interface ListTestimonialsInput {
  page?: number;
  limit?: number;
}

/**
 * Output DTO for ListTestimonialsUseCase
 */
export interface ListTestimonialsOutput {
  data: any[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * List Testimonials Use Case (Public)
 */
export class ListTestimonialsUseCase {
  private readonly testimonialRepository: ITestimonialRepository;

  constructor(testimonialRepository?: ITestimonialRepository) {
    this.testimonialRepository =
      testimonialRepository ??
      resolve<ITestimonialRepository>(TOKENS.ITestimonialRepository);
  }

  /**
   * Execute the use case
   */
  async execute(input: ListTestimonialsInput): Promise<ListTestimonialsOutput> {
    const page = input.page ?? 1;
    const limit = input.limit ?? 10;

    const result = await this.testimonialRepository.findAllApproved(
      page,
      limit,
    );
    return result;
  }
}
