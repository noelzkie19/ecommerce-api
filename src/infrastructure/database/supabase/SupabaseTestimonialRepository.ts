/**
 * Supabase Testimonial Repository
 *
 * Implements ITestimonialRepository using Supabase as the data store.
 * This is part of the infrastructure layer.
 */

import { supabaseAdmin } from "../../../config/supabase";
import { AppError } from "../../../common/utils/AppError";
import {
  ITestimonialRepository,
  PaginatedTestimonials,
} from "../../../domain/interfaces/ITestimonialRepository";
import {
  Testimonial,
  TestimonialFilters,
  CreateTestimonialProps,
  UpdateTestimonialProps,
  TestimonialDatabaseRow,
  TestimonialStats,
} from "../../../domain/entities/Testimonial";

const db = supabaseAdmin as any;

const TESTIMONIAL_FIELDS = `
  id,
  customer_name,
  location,
  rating,
  message,
  status,
  created_at,
  updated_at
` as const;

/**
 * Supabase implementation of ITestimonialRepository
 */
export class SupabaseTestimonialRepository implements ITestimonialRepository {
  /**
   * Find all testimonials with pagination and optional filters
   */
  async findAll(
    filters: TestimonialFilters = {},
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginatedTestimonials> {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = db
      .from("testimonials")
      .select(TESTIMONIAL_FIELDS, { count: "exact" })
      .range(from, to)
      .order("created_at", { ascending: false });

    if (filters.status) query = query.eq("status", filters.status);
    if (filters.search) {
      query = query.or(
        `customer_name.ilike.%${filters.search}%,message.ilike.%${filters.search}%`,
      );
    }

    const { data, error, count } = await query;
    if (error) throw new AppError(error.message, 500);

    return {
      data: (data ?? []).map((row: TestimonialDatabaseRow) =>
        Testimonial.fromDatabase(row),
      ),
      meta: {
        total: count ?? 0,
        page,
        limit,
        totalPages: Math.ceil((count ?? 0) / limit),
      },
    };
  }

  /**
   * Find all approved testimonials with pagination
   */
  async findAllApproved(
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginatedTestimonials> {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await db
      .from("testimonials")
      .select(TESTIMONIAL_FIELDS, { count: "exact" })
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) throw new AppError(error.message, 500);

    return {
      data: (data ?? []).map((row: TestimonialDatabaseRow) =>
        Testimonial.fromDatabase(row),
      ),
      meta: {
        total: count ?? 0,
        page,
        limit,
        totalPages: Math.ceil((count ?? 0) / limit),
      },
    };
  }

  /**
   * Find testimonial by ID
   */
  async findById(id: string): Promise<Testimonial | null> {
    const { data, error } = await db
      .from("testimonials")
      .select(TESTIMONIAL_FIELDS)
      .eq("id", id)
      .single();

    if (error) return null;
    return Testimonial.fromDatabase(data as TestimonialDatabaseRow);
  }

  /**
   * Create a new testimonial
   */
  async create(props: CreateTestimonialProps): Promise<Testimonial> {
    const { data, error } = await db
      .from("testimonials")
      .insert({
        customer_name: props.customerName,
        location: props.location ?? null,
        rating: props.rating,
        message: props.message,
        status: "pending",
      })
      .select(TESTIMONIAL_FIELDS)
      .single();

    if (error) throw new AppError(error.message, 500);
    return Testimonial.fromDatabase(data as TestimonialDatabaseRow);
  }

  /**
   * Update a testimonial
   */
  async update(
    id: string,
    data: Partial<UpdateTestimonialProps>,
  ): Promise<Testimonial> {
    const payload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (data.customerName !== undefined) payload.customer_name = data.customerName;
    if (data.location !== undefined) payload.location = data.location;
    if (data.rating !== undefined) payload.rating = data.rating;
    if (data.message !== undefined) payload.message = data.message;
    if (data.status !== undefined) payload.status = data.status;

    const { data: updated, error } = await db
      .from("testimonials")
      .update(payload)
      .eq("id", id)
      .select(TESTIMONIAL_FIELDS)
      .single();

    if (error) throw new AppError("Testimonial not found", 404);
    return Testimonial.fromDatabase(updated as TestimonialDatabaseRow);
  }

  /**
   * Delete a testimonial
   */
  async delete(id: string): Promise<void> {
    const { error } = await db.from("testimonials").delete().eq("id", id);
    if (error) throw new AppError("Testimonial not found", 404);
  }

  /**
   * Get testimonial statistics
   */
  async getStats(): Promise<TestimonialStats> {
    const { data, error } = await db
      .from("testimonials")
      .select("status, rating");

    if (error) throw new AppError(error.message, 500);

    const rows = (data ?? []) as { status: string; rating: number }[];
    const total = rows.length;
    const pending = rows.filter((r) => r.status === "pending").length;
    const approved = rows.filter((r) => r.status === "approved").length;
    const rejected = rows.filter((r) => r.status === "rejected").length;
    const averageRating =
      total > 0
        ? Math.round(
            (rows.reduce((sum, r) => sum + (r.rating ?? 0), 0) / total) * 10,
          ) / 10
        : 0;

    return { total, pending, approved, rejected, averageRating };
  }
}
