/**
 * Supabase Affiliate Pixel Repository
 *
 * Implements IAffiliatePixelRepository using Supabase as the data store.
 * This is part of the infrastructure layer.
 */

import { supabaseAdmin } from "../../../config/supabase";
import { AppError } from "../../../common/utils/AppError";
import {
  IAffiliatePixelRepository,
  CreatePixelEventInput,
  FailedPixelEvent,
  PixelEventStats,
} from "../../../domain/interfaces/IAffiliatePixelRepository";
import {
  AffiliatePixelEvent,
  PaginatedPixelEvents,
  PixelEventStatus,
  MetaEventType,
} from "../../../application/use-cases/affiliate-pixel";

const db = supabaseAdmin as any;

/**
 * Supabase implementation of IAffiliatePixelRepository
 */
export class SupabaseAffiliatePixelRepository implements IAffiliatePixelRepository {
  /**
   * Create a new pixel event
   */
  async createPixelEvent(
    input: CreatePixelEventInput,
  ): Promise<AffiliatePixelEvent> {
    const { data, error } = await db
      .from("affiliate_pixel_events")
      .insert({
        affiliate_id: input.affiliateId,
        order_id: input.orderId,
        event_type: input.eventType,
        pixel_id: input.pixelId,
        event_id: input.eventId,
        event_data: input.eventData ? JSON.stringify(input.eventData) : null,
        status: input.status,
        meta_response: input.metaResponse
          ? JSON.stringify(input.metaResponse)
          : null,
      })
      .select()
      .single();

    if (error) throw new AppError(error.message, 500);
    return this.mapToAffiliatePixelEvent(data);
  }

  /**
   * Get pixel events by affiliate ID with pagination
   */
  async getPixelEventsByAffiliate(
    affiliateId: string,
    page: number,
    limit: number,
  ): Promise<PaginatedPixelEvents> {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await db
      .from("affiliate_pixel_events")
      .select(
        `
        *,
        affiliate:affiliates ( id, name, email ),
        order:orders ( id, total, status )
      `,
        { count: "exact" },
      )
      .eq("affiliate_id", affiliateId)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) throw new AppError(error.message, 500);

    return {
      data: (data || []).map((row: any) => this.mapToAffiliatePixelEvent(row)),
      meta: {
        total: count ?? 0,
        page,
        limit,
        totalPages: Math.ceil((count ?? 0) / limit),
      },
    };
  }

  /**
   * Get a single pixel event by ID
   */
  async getPixelEventById(id: string): Promise<AffiliatePixelEvent | null> {
    const { data, error } = await db
      .from("affiliate_pixel_events")
      .select(
        `
        *,
        affiliate:affiliates ( id, name, email ),
        order:orders ( id, total, status )
      `,
      )
      .eq("id", id)
      .single();

    if (error) return null;
    return this.mapToAffiliatePixelEvent(data);
  }

  /**
   * Update pixel event status
   */
  async updatePixelEventStatus(
    id: string,
    status: PixelEventStatus,
    metaResponse?: Record<string, unknown>,
    retryCount?: number,
  ): Promise<AffiliatePixelEvent> {
    const updates: Record<string, any> = {
      status,
    };

    if (metaResponse) {
      updates.meta_response = JSON.stringify(metaResponse);
    }

    if (retryCount !== undefined) {
      updates.retry_count = retryCount;
    }

    if (status === "sent") {
      updates.sent_at = new Date().toISOString();
    }

    const { data, error } = await db
      .from("affiliate_pixel_events")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw new AppError(error.message, 500);
    return this.mapToAffiliatePixelEvent(data);
  }

  /**
   * Get failed events for retry
   */
  async getFailedEvents(limit: number): Promise<FailedPixelEvent[]> {
    const { data, error } = await db
      .from("affiliate_pixel_events")
      .select("*")
      .eq("status", "failed")
      .lt("retry_count", 5) // Max 5 retries
      .order("created_at", { ascending: true })
      .limit(limit);

    if (error) throw new AppError(error.message, 500);

    // Parse event_data for each event
    return (data || []).map((event: any) => ({
      ...event,
      event_data: event.event_data ? JSON.parse(event.event_data) : null,
      meta_response: event.meta_response
        ? JSON.parse(event.meta_response)
        : null,
    }));
  }

  /**
   * Get pixel events by order ID
   */
  async getPixelEventsByOrder(orderId: string): Promise<AffiliatePixelEvent[]> {
    const { data, error } = await db
      .from("affiliate_pixel_events")
      .select(
        `
        *,
        affiliate:affiliates ( id, name, email )
      `,
      )
      .eq("order_id", orderId)
      .order("created_at", { ascending: false });

    if (error) throw new AppError(error.message, 500);
    return (data || []).map((row: any) => this.mapToAffiliatePixelEvent(row));
  }

  /**
   * Delete a pixel event
   */
  async deletePixelEvent(id: string): Promise<void> {
    const { error } = await db
      .from("affiliate_pixel_events")
      .delete()
      .eq("id", id);

    if (error) throw new AppError("Pixel event not found", 404);
  }

  /**
   * Get event statistics
   */
  async getEventStats(affiliateId?: string): Promise<PixelEventStats> {
    let query = db
      .from("affiliate_pixel_events")
      .select("status, event_type", { count: "exact", head: true });

    if (affiliateId) {
      query = query.eq("affiliate_id", affiliateId);
    }

    const { data, error } = await query;

    if (error) throw new AppError(error.message, 500);

    const stats: PixelEventStats = {
      total: 0,
      sent: 0,
      pending: 0,
      failed: 0,
      byType: {},
    };

    (data || []).forEach((event: any) => {
      stats.total++;
      if (event.status === "sent") stats.sent++;
      else if (event.status === "pending") stats.pending++;
      else if (event.status === "failed") stats.failed++;

      stats.byType[event.event_type] =
        (stats.byType[event.event_type] || 0) + 1;
    });

    return stats;
  }

  /**
   * Map database row to AffiliatePixelEvent
   */
  private mapToAffiliatePixelEvent(row: any): AffiliatePixelEvent {
    return {
      id: row.id,
      affiliateId: row.affiliate_id,
      orderId: row.order_id,
      eventType: row.event_type as MetaEventType,
      pixelId: row.pixel_id,
      eventId: row.event_id,
      eventData: row.event_data ? JSON.parse(row.event_data) : undefined,
      status: row.status as PixelEventStatus,
      metaResponse: row.meta_response
        ? JSON.parse(row.meta_response)
        : undefined,
      retryCount: row.retry_count || 0,
      createdAt: row.created_at,
      sentAt: row.sent_at,
      affiliate: row.affiliate
        ? {
            id: row.affiliate.id,
            name: row.affiliate.name,
            email: row.affiliate.email,
          }
        : undefined,
      order: row.order
        ? {
            id: row.order.id,
            total: row.order.total,
            status: row.order.status,
          }
        : undefined,
    };
  }
}
