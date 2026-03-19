/**
 * Supabase Image Library Repository
 *
 * Implementation of IImageLibraryRepository using Supabase.
 */

import { supabaseAdmin } from "../../../config/supabase";
import { AppError } from "../../../common/utils/AppError";
import {
  IImageLibraryRepository,
  ImageLibraryFilters,
  PaginatedImageLibraries,
} from "../../../domain/interfaces/IImageLibraryRepository";
import {
  ImageLibrary,
  ImageLibraryCategory,
  ImageLibraryDB,
  CreateImageLibraryProps,
  UpdateImageLibraryProps,
} from "../../../domain/entities/ImageLibrary";

/**
 * Map database row to ImageLibrary entity
 */
function mapRowToEntity(row: ImageLibraryDB): ImageLibrary {
  return ImageLibrary.fromDatabase(row);
}

/**
 * Supabase Image Library Repository Implementation
 */
export class SupabaseImageLibraryRepository implements IImageLibraryRepository {
  private readonly tableName = "image_library";

  /**
   * Find all image library items with pagination and filters
   */
  async findAll(
    page: number,
    limit: number,
    filters?: ImageLibraryFilters,
  ): Promise<PaginatedImageLibraries> {
    let query = supabaseAdmin
      .from(this.tableName)
      .select("*", { count: "exact" });

    // Apply filters
    if (filters?.category) {
      query = query.eq("category", filters.category);
    }
    if (filters?.isActive !== undefined) {
      query = query.eq("is_active", filters.isActive);
    }
    if (filters?.search) {
      query = query.or(
        `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`,
      );
    }

    // Calculate offset
    const offset = (page - 1) * limit;

    // Apply pagination and ordering
    query = query
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw new AppError(
        `Failed to fetch image library items: ${error.message}`,
        500,
      );
    }

    const images = (data || []).map(mapRowToEntity);
    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    return {
      images,
      meta: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  /**
   * Find active image library items (for public display)
   */
  async findActive(
    category?: ImageLibraryCategory,
    limit: number = 10,
  ): Promise<ImageLibrary[]> {
    let query = supabaseAdmin
      .from(this.tableName)
      .select("*")
      .eq("is_active", true);

    if (category) {
      query = query.eq("category", category);
    }

    const { data, error } = await query
      .order("display_order", { ascending: true })
      .limit(limit);

    if (error) {
      throw new AppError(
        `Failed to fetch active image library items: ${error.message}`,
        500,
      );
    }

    return (data || []).map(mapRowToEntity);
  }

  /**
   * Find an image library item by ID
   */
  async findById(id: string): Promise<ImageLibrary | null> {
    const { data, error } = await supabaseAdmin
      .from(this.tableName)
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null; // No result found
      }
      throw new AppError(
        `Failed to fetch image library item: ${error.message}`,
        500,
      );
    }

    return mapRowToEntity(data as ImageLibraryDB);
  }

  /**
   * Create a new image library item
   */
  async create(props: CreateImageLibraryProps): Promise<ImageLibrary> {
    const dbData = {
      title: props.title,
      category: props.category ?? "gallery",
      thumbnail_url: props.thumbnailUrl ?? null,
      image_url: props.imageUrl,
      description: props.description ?? null,
      display_order: props.displayOrder ?? 0,
      is_active: props.isActive ?? true,
    };

    const { data, error } = await supabaseAdmin
      .from(this.tableName)
      .insert(dbData)
      .select()
      .single();

    if (error) {
      throw new AppError(
        `Failed to create image library item: ${error.message}`,
        500,
      );
    }

    return mapRowToEntity(data as ImageLibraryDB);
  }

  /**
   * Update an existing image library item
   */
  async update(
    id: string,
    props: UpdateImageLibraryProps,
  ): Promise<ImageLibrary> {
    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {};

    if (props.title !== undefined) updateData.title = props.title;
    if (props.category !== undefined) updateData.category = props.category;
    if (props.thumbnailUrl !== undefined)
      updateData.thumbnail_url = props.thumbnailUrl;
    if (props.imageUrl !== undefined) updateData.image_url = props.imageUrl;
    if (props.description !== undefined)
      updateData.description = props.description;
    if (props.displayOrder !== undefined)
      updateData.display_order = props.displayOrder;
    if (props.isActive !== undefined) updateData.is_active = props.isActive;

    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from(this.tableName)
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw new AppError(
        `Failed to update image library item: ${error.message}`,
        500,
      );
    }

    return mapRowToEntity(data as ImageLibraryDB);
  }

  /**
   * Delete an image library item
   */
  async delete(id: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from(this.tableName)
      .delete()
      .eq("id", id);

    if (error) {
      throw new AppError(
        `Failed to delete image library item: ${error.message}`,
        500,
      );
    }
  }

  /**
   * Toggle the active status of an image library item
   */
  async toggleActive(id: string): Promise<ImageLibrary> {
    // First get current status
    const current = await this.findById(id);
    if (!current) {
      throw new AppError("Image library item not found", 404);
    }

    return this.update(id, { isActive: !current.isActive });
  }

  /**
   * Reorder image library items (update display_order)
   */
  async reorder(ids: string[]): Promise<void> {
    // Update each item's display_order based on its position in the array
    const updates = ids.map((id, index) => ({
      id,
      display_order: index,
      updated_at: new Date().toISOString(),
    }));

    for (const update of updates) {
      const { error } = await supabaseAdmin
        .from(this.tableName)
        .update({
          display_order: update.display_order,
          updated_at: update.updated_at,
        })
        .eq("id", update.id);

      if (error) {
        throw new AppError(
          `Failed to reorder image library items: ${error.message}`,
          500,
        );
      }
    }
  }

  /**
   * Count total items with optional filters
   */
  async count(filters?: ImageLibraryFilters): Promise<number> {
    let query = supabaseAdmin
      .from(this.tableName)
      .select("*", { count: "exact", head: true });

    if (filters?.category) {
      query = query.eq("category", filters.category);
    }
    if (filters?.isActive !== undefined) {
      query = query.eq("is_active", filters.isActive);
    }
    if (filters?.search) {
      query = query.or(
        `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`,
      );
    }

    const { count, error } = await query;

    if (error) {
      throw new AppError(
        `Failed to count image library items: ${error.message}`,
        500,
      );
    }

    return count || 0;
  }
}

// Export singleton instance
export const imageLibraryRepository = new SupabaseImageLibraryRepository();
