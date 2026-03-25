/**
 * Update Testimonial Use Case (Admin)
 *
 * Updates a testimonial (admin only).
 */

import {
  ITestimonialRepository,
  UpdateTestimonialDTO,
} from "../../../domain/interfaces/ITestimonialRepository";
import { resolve, TOKENS } from "../../../di/container";

/**
 * Input DTO for UpdateTestimonialUseCase
 */
export interface UpdateTestimonialInput {
  testimonialId: string;
  customerName?: string;
  location?: string;
  rating?: number;
  message?: string;
  status?: "pending" | "approved" | "rejected";
}

/**
 * Output DTO for UpdateTestimonialUseCase
 */
export interface UpdateTestimonialOutput {
  id: string;
  customerName: string;
  location: string | null;
  rating: number;
  message: string;
  status: string;
  updatedAt: string;
}

/**
 * Update Testimonial Use Case (Admin)
 */
export class UpdateTestimonialUseCase {
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
    input: UpdateTestimonialInput,
  ): Promise<UpdateTestimonialOutput> {
    const dto: UpdateTestimonialDTO = {};
    if (input.customerName !== undefined) dto.customerName = input.customerName;
    if (input.location !== undefined) dto.location = input.location;
    if (input.rating !== undefined) dto.rating = input.rating;
    if (input.message !== undefined) dto.message = input.message;
    if (input.status !== undefined) dto.status = input.status;

    const testimonial = await this.testimonialRepository.update(
      input.testimonialId,
      dto,
    );

    return {
      id: testimonial.id,
      customerName: testimonial.customer_name,
      location: testimonial.location,
      rating: testimonial.rating,
      message: testimonial.message,
      status: testimonial.status,
      updatedAt: testimonial.updated_at,
    };
  }
}
