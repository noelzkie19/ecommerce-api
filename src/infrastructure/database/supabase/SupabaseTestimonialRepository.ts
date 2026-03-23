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
  TestimonialFilters,
  TestimonialStats,
  CreateTestimonialDTO,
  UpdateTestimonialDTO,
  PaginatedTestimonials,
} from "../../../domain/interfaces/ITestimonialRepository";

const SELECT_WITH_PRODUCT = `
  id,
  customer_name,
  location,
  rating,
  message,
  status,
  created_at,
  updated_at
`;

/**
 * Supabase implementation of ITestimonialRepository
 */
export class SupabaseTestimonialRepository implements ITestimonialRepository {
  /**
   * Find all testimonials with pagination and filters
   */
  async findAll(
    filters: TestimonialFilters,
    page: number,
    limit: number,
  ): Promise<PaginatedTestimonials> {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabaseAdmin
      .from("testimonials")
      .select(SELECT_WITH_PRODUCT, { count: "exact" })
      .range(from, to)
      .order("created_at", { ascending: false }) as unknown as any;

    if (filters.status) query = query.eq("status", filters.status);
    if (filters.search) {
      query = query.or(
        `customer_name.ilike.%${filters.search}%,message.ilike.%${filters.search}%`,
      );
    }

    const { data, error, count } = await query;
    if (error) throw new AppError(error.message, 500);

    return {
      data,
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
    page: number,
    limit: number,
  ): Promise<PaginatedTestimonials> {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await (supabaseAdmin
      .from("testimonials")
      .select(SELECT_WITH_PRODUCT, { count: "exact" })
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .range(from, to) as unknown as any);

    if (error) throw new AppError(error.message, 500);

    return {
      data,
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
  async findById(id: string): Promise<any> {
    const { data, error } = await (supabaseAdmin
      .from("testimonials")
      .select(SELECT_WITH_PRODUCT)
      .eq("id", id)
      .single() as unknown as any);

    if (error) throw new AppError("Testimonial not found", 404);
    return data;
  }

  /**
   * Create a new testimonial
   */
  async create(dto: CreateTestimonialDTO): Promise<any> {
    const { data, error } = await (supabaseAdmin
      .from("testimonials")
      .insert({
        customer_name: dto.customerName,
        location: dto.location ?? null,
        rating: dto.rating,
        message: dto.message,
        status: "pending",
      } as any)
      .select()
      .single() as unknown as any);

    if (error) throw new AppError(error.message, 500);
    return data;
  }

  /**
   * Update a testimonial
   */
  async update(id: string, dto: UpdateTestimonialDTO): Promise<any> {
    const payload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (dto.customerName !== undefined)
      payload.customer_name = dto.customerName;
    if (dto.location !== undefined) payload.location = dto.location;
    if (dto.rating !== undefined) payload.rating = dto.rating;
    if (dto.message !== undefined) payload.message = dto.message;
    if (dto.status !== undefined) payload.status = dto.status;

    const { data, error } = await (
      supabaseAdmin.from("testimonials") as unknown as any
    )
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw new AppError(error.message, 500);
    return data;
  }

  /**
   * Delete a testimonial
   */
  async remove(id: string): Promise<void> {
    const { error } = await (supabaseAdmin
      .from("testimonials")
      .delete()
      .eq("id", id) as unknown as any);

    if (error) throw new AppError(error.message, 500);
  }

  /**
   * Get testimonial statistics
   */
  async getStats(): Promise<TestimonialStats> {
    const { data, error } = (await supabaseAdmin
      .from("testimonials")
      .select("status, rating")) as unknown as any;

    if (error) throw new AppError(error.message, 500);

    const rows = data as { status: string; rating: number }[];
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
