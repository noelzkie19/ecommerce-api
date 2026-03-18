/**
 * Delete Course Use Case
 *
 * Deletes a course by ID.
 */

import { ICourseRepository } from "../../../domain/interfaces/ICourseRepository";
import { resolve, TOKENS } from "../../../di/container";

/**
 * Input DTO for DeleteCourseUseCase
 */
export interface DeleteCourseInput {
  courseId: string;
}

/**
 * Delete Course Use Case
 */
export class DeleteCourseUseCase {
  private readonly courseRepository: ICourseRepository;

  constructor(courseRepository?: ICourseRepository) {
    this.courseRepository =
      courseRepository ?? resolve<ICourseRepository>(TOKENS.ICourseRepository);
  }

  /**
   * Execute the use case
   */
  async execute(input: DeleteCourseInput): Promise<void> {
    // Check if course exists
    const course = await this.courseRepository.findById(input.courseId);
    if (!course) {
      throw new Error("Course not found");
    }

    await this.courseRepository.delete(input.courseId);
  }
}
