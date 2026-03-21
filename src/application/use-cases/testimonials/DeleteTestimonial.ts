/**
 * Delete Testimonial Use Case
 *
 * Permanently removes a testimonial by ID.
 */

import { ITestimonialRepository } from "../../../domain/interfaces/ITestimonialRepository";
import { resolve, TOKENS } from "../../../di/container";
import { AppError } from "../../../common/utils/AppError";

/**
 * Input DTO for DeleteTestimonialUseCase
 */
export interface DeleteTestimonialInput {
  id: string;
}

/**
 * Delete Testimonial Use Case
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
  async execute(input: DeleteTestimonialInput): Promise<void> {
    const existing = await this.testimonialRepository.findById(input.id);

    if (!existing) {
      throw new AppError("Testimonial not found", 404);
    }

    await this.testimonialRepository.delete(input.id);
  }
}
