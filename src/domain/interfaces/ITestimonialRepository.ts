/**
 * ITestimonialRepository Interface
 *
 * Defines the contract for testimonial data access.
 * This interface is part of the domain layer and should be implemented
 * by the infrastructure layer (e.g., Supabase implementation).
 */

import {
  Testimonial,
  TestimonialFilters,
  CreateTestimonialProps,
  UpdateTestimonialProps,
  TestimonialStats,
} from "../entities/Testimonial";

/**
 * Paginated result for testimonials
 */
export interface PaginatedTestimonials {
  data: Testimonial[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * Testimonial repository interface
 * Defines all data access operations for testimonials
 */
export interface ITestimonialRepository {
  /**
   * Find all testimonials with pagination and filters
   */
  findAll(
    filters: TestimonialFilters,
    page: number,
    limit: number,
  ): Promise<PaginatedTestimonials>;

  /**
   * Find approved testimonials with pagination
   */
  findAllApproved(
    page: number,
    limit: number,
  ): Promise<PaginatedTestimonials>;

  /**
   * Find testimonial by ID
   */
  findById(id: string): Promise<Testimonial | null>;

  /**
   * Create a new testimonial
   */
  create(props: CreateTestimonialProps): Promise<Testimonial>;

  /**
   * Update a testimonial
   */
  update(id: string, data: Partial<UpdateTestimonialProps>): Promise<Testimonial>;

  /**
   * Delete a testimonial
   */
  delete(id: string): Promise<void>;

  /**
   * Get testimonial statistics
   */
  getStats(): Promise<TestimonialStats>;
}
