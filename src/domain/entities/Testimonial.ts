/**
 * Testimonial Entity
 *
 * Represents a customer testimonial in the e-commerce platform.
 * This is a core domain entity that contains pure business logic.
 */

export type TestimonialStatus = "pending" | "approved" | "rejected";

/**
 * Testimonial entity
 */
export class Testimonial {
  readonly id: string;
  readonly customerName: string;
  readonly location: string | null;
  readonly rating: number;
  readonly message: string;
  readonly status: TestimonialStatus;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  private constructor(props: TestimonialProps) {
    this.id = props.id;
    this.customerName = props.customerName;
    this.location = props.location;
    this.rating = props.rating;
    this.message = props.message;
    this.status = props.status;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  /**
   * Factory method to create a new Testimonial
   */
  static create(props: CreateTestimonialProps): Testimonial {
    return new Testimonial({
      id: props.id,
      customerName: props.customerName,
      location: props.location ?? null,
      rating: props.rating,
      message: props.message,
      status: "pending",
      createdAt: props.createdAt ?? new Date(),
      updatedAt: props.updatedAt ?? new Date(),
    });
  }

  /**
   * Create Testimonial from database row
   */
  static fromDatabase(row: TestimonialDatabaseRow): Testimonial {
    return new Testimonial({
      id: row.id,
      customerName: row.customer_name,
      location: row.location,
      rating: row.rating,
      message: row.message,
      status: row.status,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    });
  }

  /**
   * Check if testimonial is pending review
   */
  isPending(): boolean {
    return this.status === "pending";
  }

  /**
   * Check if testimonial is approved and publicly visible
   */
  isApproved(): boolean {
    return this.status === "approved";
  }

  /**
   * Convert to plain object for response
   */
  toResponse(): TestimonialResponse {
    return {
      id: this.id,
      customerName: this.customerName,
      location: this.location,
      rating: this.rating,
      message: this.message,
      status: this.status,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }
}

/**
 * Testimonial internal properties
 */
interface TestimonialProps {
  id: string;
  customerName: string;
  location: string | null;
  rating: number;
  message: string;
  status: TestimonialStatus;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Properties for creating a new Testimonial
 */
export interface CreateTestimonialProps {
  id: string;
  customerName: string;
  location?: string | null;
  rating: number;
  message: string;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Properties for updating a Testimonial
 */
export interface UpdateTestimonialProps {
  customerName?: string;
  location?: string | null;
  rating?: number;
  message?: string;
  status?: TestimonialStatus;
}

/**
 * Testimonial query filters
 */
export interface TestimonialFilters {
  search?: string;
  status?: TestimonialStatus;
}

/**
 * Database row type (snake_case from Supabase)
 */
export interface TestimonialDatabaseRow {
  id: string;
  customer_name: string;
  location: string | null;
  rating: number;
  message: string;
  status: TestimonialStatus;
  created_at: string;
  updated_at: string;
}

/**
 * API response shape
 */
export interface TestimonialResponse {
  id: string;
  customerName: string;
  location: string | null;
  rating: number;
  message: string;
  status: TestimonialStatus;
  createdAt: string;
  updatedAt: string;
}

/**
 * Testimonial statistics
 */
export interface TestimonialStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  averageRating: number;
}
