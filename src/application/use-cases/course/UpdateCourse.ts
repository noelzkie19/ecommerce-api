/**
 * Update Course Use Case
 *
 * Updates an existing course.
 */

import { ICourseRepository } from "../../../domain/interfaces/ICourseRepository";
import {
  UpdateCourseProps,
  isValidYouTubeUrl,
} from "../../../domain/entities/Course";
import { resolve, TOKENS } from "../../../di/container";

/**
 * Input DTO for UpdateCourseUseCase
 */
export interface UpdateCourseInput {
  courseId: string;
  title?: string;
  description?: string | null;
  youtubeUrl?: string;
  thumbnailUrl?: string | null;
  duration?: number | null;
  category?: string | null;
  isPremium?: boolean;
  displayOrder?: number;
  isActive?: boolean;
}

/**
 * Output DTO for UpdateCourseUseCase
 */
export interface UpdateCourseOutput {
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
  createdAt: string;
}

/**
 * Update Course Use Case
 */
export class UpdateCourseUseCase {
  private readonly courseRepository: ICourseRepository;

  constructor(courseRepository?: ICourseRepository) {
    this.courseRepository =
      courseRepository ?? resolve<ICourseRepository>(TOKENS.ICourseRepository);
  }

  /**
   * Execute the use case
   */
  async execute(input: UpdateCourseInput): Promise<UpdateCourseOutput> {
    // Validate YouTube URL if provided
    if (input.youtubeUrl && !isValidYouTubeUrl(input.youtubeUrl)) {
      throw new Error("Invalid YouTube URL");
    }

    const updateData: Partial<UpdateCourseProps> = {
      title: input.title,
      description: input.description,
      youtubeUrl: input.youtubeUrl,
      thumbnailUrl: input.thumbnailUrl,
      duration: input.duration,
      category: input.category,
      isPremium: input.isPremium,
      displayOrder: input.displayOrder,
      isActive: input.isActive,
    };

    // Remove undefined values
    Object.keys(updateData).forEach((key) => {
      if (updateData[key as keyof UpdateCourseProps] === undefined) {
        delete updateData[key as keyof UpdateCourseProps];
      }
    });

    const course = await this.courseRepository.update(
      input.courseId,
      updateData,
    );
    return course.toResponse();
  }
}
