/**
 * Get Testimonial By ID Use Case
 *
 * Retrieves a single testimonial by its unique identifier.
 */

import { ITestimonialRepository } from "../../../domain/interfaces/ITestimonialRepository";
import { TestimonialResponse } from "../../../domain/entities/Testimonial";
import { resolve, TOKENS } from "../../../di/container";
import { AppError } from "../../../common/utils/AppError";

/**
 * Input DTO for GetTestimonialByIdUseCase
 */
export interface GetTestimonialByIdInput {
  id: string;
}

/**
 * Output DTO for GetTestimonialByIdUseCase
 */
export type GetTestimonialByIdOutput = TestimonialResponse;

/**
 * Get Testimonial By ID Use Case
 */
export class GetTestimonialByIdUseCase {
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
    input: GetTestimonialByIdInput,
  ): Promise<GetTestimonialByIdOutput> {
    const testimonial = await this.testimonialRepository.findById(input.id);

    if (!testimonial) {
      throw new AppError("Testimonial not found", 404);
    }

    return testimonial.toResponse();
  }
}
