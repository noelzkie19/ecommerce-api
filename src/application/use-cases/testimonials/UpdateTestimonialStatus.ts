/**
 * Update Testimonial Status Use Case
 *
 * Updates the status of a testimonial (approve or reject).
 * Used by admin to moderate submitted testimonials.
 */

import { ITestimonialRepository } from "../../../domain/interfaces/ITestimonialRepository";
import { resolve, TOKENS } from "../../../di/container";
import { AppError } from "../../../common/utils/AppError";

/**
 * Input DTO for UpdateTestimonialStatusUseCase
 */
export interface UpdateTestimonialStatusInput {
  id: string;
  status: "approved" | "rejected";
}

/**
 * Output DTO for UpdateTestimonialStatusUseCase
 */
export interface UpdateTestimonialStatusOutput {
  id: string;
  customerName: string;
  location: string | null;
  rating: number;
  message: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  updatedAt: string;
}

/**
 * Update Testimonial Status Use Case
 */
export class UpdateTestimonialStatusUseCase {
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
    input: UpdateTestimonialStatusInput,
  ): Promise<UpdateTestimonialStatusOutput> {
    const existing = await this.testimonialRepository.findById(input.id);

    if (!existing) {
      throw new AppError("Testimonial not found", 404);
    }

    const updated = await this.testimonialRepository.update(input.id, {
      status: input.status,
    });

    return updated.toResponse();
  }
}
