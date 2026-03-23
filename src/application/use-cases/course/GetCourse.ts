/**
 * Get Course Use Case
 *
 * Retrieves a single course by ID.
 */

import { ICourseRepository } from "../../../domain/interfaces/ICourseRepository";
import { resolve, TOKENS } from "../../../di/container";

/**
 * Input DTO for GetCourseUseCase
 */
export interface GetCourseInput {
  courseId: string;
}

/**
 * Output DTO for GetCourseUseCase
 */
export interface GetCourseOutput {
  id: string;
  title: string;
  description: string | null;
  youtubeUrl: string;
  youtubeVideoId: string;
  thumbnailUrl: string | null;
  duration: number | null;
  formattedDuration: string | null;
  category: string | null;
  isPremium: boolean;
  viewsCount: number;
  embedUrl: string;
  createdAt: string | null;
}

/**
 * Get Course Use Case
 */
export class GetCourseUseCase {
  private readonly courseRepository: ICourseRepository;

  constructor(courseRepository?: ICourseRepository) {
    this.courseRepository =
      courseRepository ?? resolve<ICourseRepository>(TOKENS.ICourseRepository);
  }

  /**
   * Execute the use case
   */
  async execute(input: GetCourseInput): Promise<GetCourseOutput | null> {
    const course = await this.courseRepository.findById(input.courseId);

    if (!course) {
      return null;
    }

    // Increment views
    await this.courseRepository.incrementViews(input.courseId);

    return course.toResponse();
  }
}
