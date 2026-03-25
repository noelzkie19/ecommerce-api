/**
 * Create Testimonial Use Case
 *
 * Creates a new testimonial (public endpoint).
 */

import {
  ITestimonialRepository,
  CreateTestimonialDTO,
} from "../../../domain/interfaces/ITestimonialRepository";
import { resolve, TOKENS } from "../../../di/container";

/**
 * Input DTO for CreateTestimonialUseCase
 */
export interface CreateTestimonialInput {
  customerName: string;
  location?: string;
  rating: number;
  message: string;
}

/**
 * Output DTO for CreateTestimonialUseCase
 */
export interface CreateTestimonialOutput {
  id: string;
  customerName: string;
  location: string | null;
  rating: number;
  message: string;
  status: string;
  createdAt: string;
}

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
    const dto: CreateTestimonialDTO = {
      customerName: input.customerName,
      location: input.location ?? null,
      rating: input.rating,
      message: input.message,
    };

    const testimonial = await this.testimonialRepository.create(dto);

    return {
      id: testimonial.id,
      customerName: testimonial.customer_name,
      location: testimonial.location,
      rating: testimonial.rating,
      message: testimonial.message,
      status: testimonial.status,
      createdAt: testimonial.created_at,
    };
  }
}
