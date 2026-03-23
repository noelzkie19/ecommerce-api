/**
 * List Courses Use Case
 *
 * Lists courses with pagination and filters.
 */

import { ICourseRepository } from "../../../domain/interfaces/ICourseRepository";
import { CourseFilters } from "../../../domain/entities/Course";
import { resolve, TOKENS } from "../../../di/container";

/**
 * Input DTO for ListCoursesUseCase
 */
export interface ListCoursesInput {
  page?: number;
  limit?: number;
  filters?: CourseFilters;
}

/**
 * Output DTO for ListCoursesUseCase
 */
export interface ListCoursesOutput {
  courses: Array<{
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
  }>;
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * List Courses Use Case
 */
export class ListCoursesUseCase {
  private readonly courseRepository: ICourseRepository;

  constructor(courseRepository?: ICourseRepository) {
    this.courseRepository =
      courseRepository ?? resolve<ICourseRepository>(TOKENS.ICourseRepository);
  }

  /**
   * Execute the use case
   */
  async execute(input: ListCoursesInput): Promise<ListCoursesOutput> {
    const page = input.page ?? 1;
    const limit = input.limit ?? 10;

    const result = await this.courseRepository.findAllPaginated(
      page,
      limit,
      input.filters,
    );

    return {
      courses: result.data.map((course) => course.toResponse()),
      meta: result.meta,
    };
  }
}
