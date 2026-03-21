import { supabaseAdmin } from "../../config/supabase";
import { AppError } from "../../common/utils/AppError";
import {
  MetaEventType,
  PixelEventStatus,
} from "../../application/use-cases/affiliate-pixel";

const db = supabaseAdmin as any;

// ── Create Pixel Event ─────────────────────────────────────────────────────

export const createPixelEvent = async (params: {
  affiliateId: string;
  orderId: string;
  eventType: MetaEventType;
  pixelId: string;
  eventId: string;
  eventData?: Record<string, any>;
  status: PixelEventStatus;
  metaResponse?: Record<string, any>;
}) => {
  const { data, error } = await db
    .from("affiliate_pixel_events")
    .insert({
      affiliate_id: params.affiliateId,
      order_id: params.orderId,
      event_type: params.eventType,
      pixel_id: params.pixelId,
      event_id: params.eventId,
      event_data: params.eventData ? JSON.stringify(params.eventData) : null,
      status: params.status,
      meta_response: params.metaResponse
        ? JSON.stringify(params.metaResponse)
        : null,
    })
    .select()
    .single();

  if (error) throw new AppError(error.message, 500);
  return data;
};

// ── Get Pixel Events ────────────────────────────────────────────────────

export const getPixelEventsByAffiliate = async (
  affiliateId: string,
  page: number = 1,
  limit: number = 20,
) => {
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
    data: data || [],
    meta: {
      total: count ?? 0,
      page,
      limit,
      totalPages: Math.ceil((count ?? 0) / limit),
    },
  };
};

export const getPixelEventById = async (id: string) => {
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

  if (error) throw new AppError("Pixel event not found", 404);
  return data;
};

// ── Update Pixel Event ─────────────────────────────────────────────────

export const updatePixelEventStatus = async (
  id: string,
  status: PixelEventStatus,
  metaResponse?: Record<string, any>,
  retryCount?: number,
) => {
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
  return data;
};

// ── Get Failed Events ───────────────────────────────────────────────────

export const getFailedEvents = async (limit: number = 10) => {
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
    meta_response: event.meta_response ? JSON.parse(event.meta_response) : null,
  }));
};

// ── Get Events by Order ────────────────────────────────────────────────

export const getPixelEventsByOrder = async (orderId: string) => {
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
  return data || [];
};

// ── Delete Pixel Event ─────────────────────────────────────────────────

export const deletePixelEvent = async (id: string) => {
  const { error } = await db
    .from("affiliate_pixel_events")
    .delete()
    .eq("id", id);

  if (error) throw new AppError("Pixel event not found", 404);
};

// ── Get Event Stats ────────────────────────────────────────────────────

export const getEventStats = async (affiliateId?: string) => {
  let query = db
    .from("affiliate_pixel_events")
    .select("status, event_type", { count: "exact", head: true });

  if (affiliateId) {
    query = query.eq("affiliate_id", affiliateId);
  }

  const { data, error } = await query;

  if (error) throw new AppError(error.message, 500);

  const stats = {
    total: 0,
    sent: 0,
    pending: 0,
    failed: 0,
    byType: {} as Record<string, number>,
  };

  (data || []).forEach((event: any) => {
    stats.total++;
    if (event.status === "sent") stats.sent++;
    else if (event.status === "pending") stats.pending++;
    else if (event.status === "failed") stats.failed++;

    stats.byType[event.event_type] = (stats.byType[event.event_type] || 0) + 1;
  });

  return stats;
};
