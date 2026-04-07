/**
 * Supabase Course Repository
 *
 * Implements ICourseRepository using Supabase as the data store.
 * This is part of the infrastructure layer.
 */

import { supabaseAdmin } from "../../../config/supabase";
import { AppError } from "../../../common/utils/AppError";
import {
  ICourseRepository,
  PaginatedResult,
} from "../../../domain/interfaces/ICourseRepository";
import {
  Course,
  CreateCourseProps,
  UpdateCourseProps,
  CourseFilters,
  extractVideoId,
} from "../../../domain/entities/Course";

const db = supabaseAdmin as any;

/**
 * Supabase implementation of ICourseRepository
 */
export class SupabaseCourseRepository implements ICourseRepository {
  /**
   * Find all courses with pagination and filters
   */
  async findAllPaginated(
    page: number,
    limit: number,
    filters?: CourseFilters,
  ): Promise<PaginatedResult<Course>> {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = db
      .from("courses")
      .select("*", { count: "exact" })
      .range(from, to);

    // Only show active courses for public queries
    if (filters?.isActive === undefined) {
      query = query.eq("is_active", true);
    } else {
      query = query.eq("is_active", filters.isActive);
    }

    if (filters?.category) {
      query = query.eq("category", filters.category);
    }
    if (filters?.search) {
      query = query.ilike("title", `%${filters.search}%`);
    }
    if (filters?.isPremium !== undefined) {
      query = query.eq("is_premium", filters.isPremium);
    }

    // Order by created_at descending
    query = query.order("created_at", { ascending: false });

    const { data, error, count } = await query;
    if (error) throw new AppError(error.message, 500);

    const courses = (data ?? []).map((row: any) => Course.fromDatabase(row));

    return {
      data: courses,
      meta: {
        total: count ?? 0,
        page,
        limit,
        totalPages: Math.ceil((count ?? 0) / limit),
      },
    };
  }

  /**
   * Find course by ID
   */
  async findById(id: string): Promise<Course | null> {
    const { data, error } = await db
      .from("courses")
      .select("*")
      .eq("id", id)
      .single();

    if (error) return null;
    return Course.fromDatabase(data);
  }

  /**
   * Find courses by category
   */
  async findByCategory(category: string): Promise<Course[]> {
    const { data, error } = await db
      .from("courses")
      .select("*")
      .eq("category", category)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) throw new AppError(error.message, 500);

    return (data ?? []).map((row: any) => Course.fromDatabase(row));
  }

  /**
   * Find courses by search term
   */
  async findBySearch(search: string): Promise<Course[]> {
    const { data, error } = await db
      .from("courses")
      .select("*")
      .ilike("title", `%${search}%`)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) throw new AppError(error.message, 500);

    return (data ?? []).map((row: any) => Course.fromDatabase(row));
  }

  /**
   * Get all unique categories
   */
  async getCategories(): Promise<string[]> {
    const { data, error } = await db
      .from("courses")
      .select("category")
      .eq("is_active", true)
      .not("category", "is", null);

    if (error) throw new AppError(error.message, 500);

    const categories = new Set<string>();
    data?.forEach((row: { category: string }) => {
      if (row.category) {
        categories.add(row.category);
      }
    });

    return Array.from(categories).sort((a, b) => a.localeCompare(b));
  }

  /**
   * Create a new course
   */
  async create(props: CreateCourseProps): Promise<Course> {
    const youtubeVideoId = props.youtubeVideoId ?? extractVideoId(props.youtubeUrl);
    const payload = {
      id: props.id,
      title: props.title,
      description: props.description ?? null,
      youtube_url: props.youtubeUrl,
      youtube_video_id: youtubeVideoId,
      thumbnail_url: props.thumbnailUrl ?? null,
      category: props.category ?? null,
      is_premium: props.isPremium ?? false,
      is_active: props.isActive ?? true,
      views_count: props.viewsCount ?? 0,
    };

    const { data, error } = await db
      .from("courses")
      .insert(payload)
      .select("*")
      .single();

    if (error) throw new AppError(error.message, 500);
    return Course.fromDatabase(data);
  }

  /**
   * Update a course
   */
  async update(id: string, data: Partial<UpdateCourseProps>): Promise<Course> {
    const payload = Object.fromEntries(
      Object.entries({
        title: data.title,
        description: data.description,
        youtube_url: data.youtubeUrl,
        thumbnail_url: data.thumbnailUrl,
        category: data.category,
        is_premium: data.isPremium,
        is_active: data.isActive,
      }).filter(([, v]) => v !== undefined),
    );

    // Add updated_at
    (payload as any).updated_at = new Date().toISOString();

    const { data: updated, error } = await db
      .from("courses")
      .update(payload)
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw new AppError("Course not found", 404);
    return Course.fromDatabase(updated);
  }

  /**
   * Delete a course
   */
  async delete(id: string): Promise<void> {
    const { error } = await db.from("courses").delete().eq("id", id);
    if (error) throw new AppError("Course not found", 404);
  }

  /**
   * Increment views count
   */
  async incrementViews(id: string): Promise<void> {
    const { error } = await db
      .from("courses")
      .update({ views_count: db.raw("views_count + 1") })
      .eq("id", id);

    if (error) {
      // Silent fail - don't throw
    }
  }
}

// Export singleton instance
export const courseRepository = new SupabaseCourseRepository();
