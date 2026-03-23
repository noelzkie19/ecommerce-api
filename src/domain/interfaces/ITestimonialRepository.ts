/**
 * ITestimonialRepository Interface
 *
 * Defines the contract for testimonial data access.
 * This interface is part of the domain layer and should be implemented
 * by the infrastructure layer (e.g., Supabase implementation).
 */

export type TestimonialStatus = "pending" | "approved" | "rejected";

export interface TestimonialFilters {
  search?: string;
  status?: TestimonialStatus;
}

export interface TestimonialStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  averageRating: number;
}

export interface CreateTestimonialDTO {
  customerName: string;
  location?: string | null;
  rating: number;
  message: string;
}

export interface UpdateTestimonialDTO {
  customerName?: string;
  location?: string;
  rating?: number;
  message?: string;
  status?: TestimonialStatus;
}

export interface PaginatedTestimonials {
  data: any[];
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
   * Find all approved testimonials with pagination
   */
  findAllApproved(page: number, limit: number): Promise<PaginatedTestimonials>;

  /**
   * Find testimonial by ID
   */
  findById(id: string): Promise<any>;

  /**
   * Create a new testimonial
   */
  create(dto: CreateTestimonialDTO): Promise<any>;

  /**
   * Update a testimonial
   */
  update(id: string, dto: UpdateTestimonialDTO): Promise<any>;

  /**
   * Delete a testimonial
   */
  remove(id: string): Promise<void>;

  /**
   * Get testimonial statistics
   */
  getStats(): Promise<TestimonialStats>;
}
