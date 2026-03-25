/**
 * Delete Testimonial Use Case (Admin)
 *
 * Deletes a testimonial (admin only).
 */

import { ITestimonialRepository } from "../../../domain/interfaces/ITestimonialRepository";
import { resolve, TOKENS } from "../../../di/container";

/**
 * Input DTO for DeleteTestimonialUseCase
 */
export interface DeleteTestimonialInput {
  testimonialId: string;
}

/**
 * Output DTO for DeleteTestimonialUseCase
 */
export interface DeleteTestimonialOutput {
  success: boolean;
}

/**
 * Delete Testimonial Use Case (Admin)
 */
export class DeleteTestimonialUseCase {
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
    input: DeleteTestimonialInput,
  ): Promise<DeleteTestimonialOutput> {
    await this.testimonialRepository.remove(input.testimonialId);
    return { success: true };
  }
}
