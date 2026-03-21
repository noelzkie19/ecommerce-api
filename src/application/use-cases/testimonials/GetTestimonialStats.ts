/**
 * Get Testimonial Stats Use Case
 *
 * Returns aggregate statistics for all testimonials.
 */

import { ITestimonialRepository } from "../../../domain/interfaces/ITestimonialRepository";
import { TestimonialStats } from "../../../domain/entities/Testimonial";
import { resolve, TOKENS } from "../../../di/container";

/**
 * Output DTO for GetTestimonialStatsUseCase
 */
export type GetTestimonialStatsOutput = TestimonialStats;

/**
 * Get Testimonial Stats Use Case
 */
export class GetTestimonialStatsUseCase {
  private readonly testimonialRepository: ITestimonialRepository;

  constructor(testimonialRepository?: ITestimonialRepository) {
    this.testimonialRepository =
      testimonialRepository ??
      resolve<ITestimonialRepository>(TOKENS.ITestimonialRepository);
  }

  /**
   * Execute the use case
   */
  async execute(): Promise<GetTestimonialStatsOutput> {
    return this.testimonialRepository.getStats();
  }
}
