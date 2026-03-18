/**
 * ICourseRepository Interface
 *
 * Defines the contract for course data access.
 * This interface is part of the domain layer and should be implemented
 * by the infrastructure layer (e.g., Supabase implementation).
 */

import {
  Course,
  CourseFilters,
  CreateCourseProps,
  UpdateCourseProps,
} from "../entities/Course";

/**
 * Pagination result
 */
export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * Course repository interface
 * Defines all data access operations for courses
 */
export interface ICourseRepository {
  /**
   * Find all courses with pagination and filters
   */
  findAllPaginated(
    page: number,
    limit: number,
    filters?: CourseFilters,
  ): Promise<PaginatedResult<Course>>;

  /**
   * Find course by ID
   */
  findById(id: string): Promise<Course | null>;

  /**
   * Find courses by category
   */
  findByCategory(category: string): Promise<Course[]>;

  /**
   * Find courses by search term
   */
  findBySearch(search: string): Promise<Course[]>;

  /**
   * Get all unique categories
   */
  getCategories(): Promise<string[]>;

  /**
   * Create a new course
   */
  create(props: CreateCourseProps): Promise<Course>;

  /**
   * Update a course
   */
  update(id: string, data: Partial<UpdateCourseProps>): Promise<Course>;

  /**
   * Delete a course
   */
  delete(id: string): Promise<void>;

  /**
   * Increment views count
   */
  incrementViews(id: string): Promise<void>;
}
