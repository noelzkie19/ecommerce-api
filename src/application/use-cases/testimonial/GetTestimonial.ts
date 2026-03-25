/**
 * Get Testimonial Use Case
 *
 * Retrieves a single testimonial by ID.
 */

import { ITestimonialRepository } from "../../../domain/interfaces/ITestimonialRepository";
import { resolve, TOKENS } from "../../../di/container";

/**
 * Input DTO for GetTestimonialUseCase
 */
export interface GetTestimonialInput {
  testimonialId: string;
}

/**
 * Output DTO for GetTestimonialUseCase
 */
export interface GetTestimonialOutput {
  id: string;
  customerName: string;
  location: string | null;
  rating: number;
  message: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Get Testimonial Use Case
 */
export class GetTestimonialUseCase {
  private readonly testimonialRepository: ITestimonialRepository;

  constructor(testimonialRepository?: ITestimonialRepository) {
    this.testimonialRepository =
      testimonialRepository ??
      resolve<ITestimonialRepository>(TOKENS.ITestimonialRepository);
  }

  /**
   * Execute the use case
   */
  async execute(input: GetTestimonialInput): Promise<GetTestimonialOutput> {
    const testimonial = await this.testimonialRepository.findById(
      input.testimonialId,
    );

    if (!testimonial) {
      throw new Error("Testimonial not found");
    }

    return {
      id: testimonial.id,
      customerName: testimonial.customer_name,
      location: testimonial.location,
      rating: testimonial.rating,
      message: testimonial.message,
      status: testimonial.status,
      createdAt: testimonial.created_at,
      updatedAt: testimonial.updated_at,
    };
  }
}
