/**
 * Create Testimonial Use Case
 *
 * Submits a new customer testimonial with pending status.
 */

import { ITestimonialRepository } from "../../../domain/interfaces/ITestimonialRepository";
import { TestimonialResponse } from "../../../domain/entities/Testimonial";
import { resolve, TOKENS } from "../../../di/container";

/**
 * Input DTO for CreateTestimonialUseCase
 */
export interface CreateTestimonialInput {
  customerName: string;
  rating: number;
  message: string;
  location?: string | null;
}

/**
 * Output DTO for CreateTestimonialUseCase
 */
export type CreateTestimonialOutput = TestimonialResponse;

/**
 * Create Testimonial Use Case
 */
export class CreateTestimonialUseCase {
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
    input: CreateTestimonialInput,
  ): Promise<CreateTestimonialOutput> {
    const testimonial = await this.testimonialRepository.create({
      id: crypto.randomUUID(),
      customerName: input.customerName,
      rating: input.rating,
      message: input.message,
      location: input.location ?? null,
    });

    return testimonial.toResponse();
  }
}
