/**
 * Create Course Use Case
 *
 * Creates a new course (YouTube video).
 */

import { ICourseRepository } from "../../../domain/interfaces/ICourseRepository";
import {
  CreateCourseProps,
  isValidYouTubeUrl,
} from "../../../domain/entities/Course";
import { resolve, TOKENS } from "../../../di/container";

/**
 * Input DTO for CreateCourseUseCase
 */
export interface CreateCourseInput {
  title: string;
  description?: string | null;
  youtubeUrl: string;
  thumbnailUrl?: string | null;
  duration?: number | null;
  category?: string | null;
  isPremium?: boolean;
  displayOrder?: number;
}

/**
 * Output DTO for CreateCourseUseCase
 */
export interface CreateCourseOutput {
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
 * Create Course Use Case
 */
export class CreateCourseUseCase {
  private readonly courseRepository: ICourseRepository;

  constructor(courseRepository?: ICourseRepository) {
    this.courseRepository =
      courseRepository ?? resolve<ICourseRepository>(TOKENS.ICourseRepository);
  }

  /**
   * Execute the use case
   */
  async execute(input: CreateCourseInput): Promise<CreateCourseOutput> {
    // Validate YouTube URL
    if (!isValidYouTubeUrl(input.youtubeUrl)) {
      throw new Error("Invalid YouTube URL");
    }

    const courseProps: CreateCourseProps = {
      id: crypto.randomUUID(),
      title: input.title,
      description: input.description,
      youtubeUrl: input.youtubeUrl,
      thumbnailUrl: input.thumbnailUrl,
      duration: input.duration,
      category: input.category,
      isPremium: input.isPremium ?? false,
      displayOrder: input.displayOrder ?? 0,
    };

    const course = await this.courseRepository.create(courseProps);
    return course.toResponse();
  }
}
