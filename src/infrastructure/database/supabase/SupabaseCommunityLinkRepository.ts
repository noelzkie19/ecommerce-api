/**
 * Supabase Community Link Repository
 *
 * Implementation of ICommunityLinkRepository using Supabase.
 */

import { supabaseAdmin } from "../../../config/supabase";
import { AppError } from "../../../common/utils/AppError";
import {
  ICommunityLinkRepository,
  CommunityLinkFilters,
  PaginatedCommunityLinks,
} from "../../../domain/interfaces/ICommunityLinkRepository";
import {
  CommunityLink,
  CommunityLinkDB,
  CreateCommunityLinkProps,
  UpdateCommunityLinkProps,
} from "../../../domain/entities/CommunityLink";

/**
 * Map database row to CommunityLink entity
 */
function mapRowToEntity(row: CommunityLinkDB): CommunityLink {
  return CommunityLink.fromDatabase(row);
}

/**
 * Supabase Community Link Repository Implementation
 */
export class SupabaseCommunityLinkRepository implements ICommunityLinkRepository {
  private readonly tableName = "community_links";

  /**
   * Find all community links with pagination and filters
   */
  async findAll(
    page: number,
    limit: number,
    filters?: CommunityLinkFilters,
  ): Promise<PaginatedCommunityLinks> {
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
      .order("order_index", { ascending: true })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw new AppError(
        `Failed to fetch community links: ${error.message}`,
        500,
      );
    }

    const links = (data || []).map(mapRowToEntity);
    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    return {
      links,
      meta: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  /**
   * Find active community links (for public display)
   */
  async findActive(limit: number = 10): Promise<CommunityLink[]> {
    const { data, error } = await supabaseAdmin
      .from(this.tableName)
      .select("*")
      .eq("is_active", true)
      .order("order_index", { ascending: true })
      .limit(limit);

    if (error) {
      throw new AppError(
        `Failed to fetch active community links: ${error.message}`,
        500,
      );
    }

    return (data || []).map(mapRowToEntity);
  }

  /**
   * Find a community link by ID
   */
  async findById(id: string): Promise<CommunityLink | null> {
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
        `Failed to fetch community link: ${error.message}`,
        500,
      );
    }

    return mapRowToEntity(data as CommunityLinkDB);
  }

  /**
   * Create a new community link
   */
  async create(props: CreateCommunityLinkProps): Promise<CommunityLink> {
    const dbData = {
      title: props.title,
      url: props.url,
      description: props.description ?? null,
      category: props.category ?? "other",
      icon: props.icon ?? null,
      image_url: props.imageUrl ?? null,
      order_index: props.orderIndex ?? 0,
      is_active: props.isActive ?? true,
    };

    const { data, error } = await supabaseAdmin
      .from(this.tableName)
      .insert(dbData)
      .select()
      .single();

    if (error) {
      throw new AppError(
        `Failed to create community link: ${error.message}`,
        500,
      );
    }

    return mapRowToEntity(data as CommunityLinkDB);
  }

  /**
   * Update an existing community link
   */
  async update(
    id: string,
    props: UpdateCommunityLinkProps,
  ): Promise<CommunityLink> {
    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {};

    if (props.title !== undefined) updateData.title = props.title;
    if (props.url !== undefined) updateData.url = props.url;
    if (props.description !== undefined)
      updateData.description = props.description;
    if (props.category !== undefined) updateData.category = props.category;
    if (props.icon !== undefined) updateData.icon = props.icon;
    if (props.imageUrl !== undefined) updateData.image_url = props.imageUrl;
    if (props.orderIndex !== undefined)
      updateData.order_index = props.orderIndex;
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
        `Failed to update community link: ${error.message}`,
        500,
      );
    }

    return mapRowToEntity(data as CommunityLinkDB);
  }

  /**
   * Delete a community link
   */
  async delete(id: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from(this.tableName)
      .delete()
      .eq("id", id);

    if (error) {
      throw new AppError(
        `Failed to delete community link: ${error.message}`,
        500,
      );
    }
  }

  /**
   * Toggle the active status of a community link
   */
  async toggleActive(id: string): Promise<CommunityLink> {
    // First get current status
    const current = await this.findById(id);
    if (!current) {
      throw new AppError("Community link not found", 404);
    }

    return this.update(id, { isActive: !current.isActive });
  }

  /**
   * Reorder community links (update order_index)
   */
  async reorder(ids: string[]): Promise<void> {
    // Update each link's order_index based on its position in the array
    const updates = ids.map((id, index) => ({
      id,
      order_index: index,
      updated_at: new Date().toISOString(),
    }));

    for (const update of updates) {
      const { error } = await supabaseAdmin
        .from(this.tableName)
        .update({
          order_index: update.order_index,
          updated_at: update.updated_at,
        })
        .eq("id", update.id);

      if (error) {
        throw new AppError(
          `Failed to reorder community links: ${error.message}`,
          500,
        );
      }
    }
  }

  /**
   * Count total links with optional filters
   */
  async count(filters?: CommunityLinkFilters): Promise<number> {
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
        `Failed to count community links: ${error.message}`,
        500,
      );
    }

    return count || 0;
  }
}
