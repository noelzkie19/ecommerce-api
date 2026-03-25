/**
 * List All Testimonials Use Case (Admin)
 *
 * Retrieves all testimonials with pagination and filters (admin).
 */

import {
  ITestimonialRepository,
  TestimonialFilters,
} from "../../../domain/interfaces/ITestimonialRepository";
import { resolve, TOKENS } from "../../../di/container";

/**
 * Input DTO for ListAllTestimonialsUseCase
 */
export interface ListAllTestimonialsInput {
  page: number;
  limit: number;
  search?: string;
  status?: "pending" | "approved" | "rejected";
}

/**
 * Output DTO for ListAllTestimonialsUseCase
 */
export interface ListAllTestimonialsOutput {
  data: any[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * List All Testimonials Use Case (Admin)
 */
export class ListAllTestimonialsUseCase {
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
    input: ListAllTestimonialsInput,
  ): Promise<ListAllTestimonialsOutput> {
    const filters: TestimonialFilters = {
      search: input.search,
      status: input.status,
    };

    const result = await this.testimonialRepository.findAll(
      filters,
      input.page,
      input.limit,
    );
    return result;
  }
}
