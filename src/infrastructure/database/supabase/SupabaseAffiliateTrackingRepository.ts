/**
 * Supabase Affiliate Tracking Repository
 *
 * Implements IAffiliateTrackingRepository using Supabase as the data store.
 * This is part of the infrastructure layer.
 */

import { supabaseAdmin } from "../../../config/supabase";
import { AppError } from "../../../common/utils/AppError";
import {
  IAffiliateTrackingRepository,
  TrackingLinkWithAffiliate,
  AttributionRecord,
  TrackingStats,
  PaginatedTrackingLinks,
  PaginatedAttributions,
} from "../../../domain/interfaces/IAffiliateTrackingRepository";
import {
  CreateTrackingLinkDTO,
  UpdateTrackingLinkDTO,
  TrackingMethod,
} from "../../../application/use-cases/affiliate-tracking";

const db = supabaseAdmin as any;

/**
 * Supabase implementation of IAffiliateTrackingRepository
 */
export class SupabaseAffiliateTrackingRepository implements IAffiliateTrackingRepository {
  /**
   * Create a tracking link
   */
  async createTrackingLink(
    dto: CreateTrackingLinkDTO,
  ): Promise<TrackingLinkWithAffiliate> {
    const { data, error } = await db
      .from("affiliate_tracking_links")
      .upsert(
        {
          affiliate_id: dto.affiliateId,
          store_id: dto.storeId,
          campaign_name: dto.campaignName,
          landing_page_url: dto.landingPageUrl,
          expires_at: dto.expiresAt || null,
          is_active: true,
        },
        { onConflict: "affiliate_id,store_id,campaign_name" },
      )
      .select()
      .single();

    if (error) throw new AppError(error.message, 500);
    return this.mapToTrackingLink(data);
  }

  /**
   * Get a tracking link by ID
   */
  async getTrackingLink(id: string): Promise<TrackingLinkWithAffiliate | null> {
    const { data, error } = await db
      .from("affiliate_tracking_links")
      .select(
        `
        *,
        affiliate:affiliates ( id, name, email, pixel_id )
      `,
      )
      .eq("id", id)
      .single();

    if (error) return null;
    return this.mapToTrackingLink(data);
  }

  /**
   * Get tracking link by affiliate and store
   */
  async getTrackingLinkByAffiliate(
    affiliateId: string,
    storeId: string,
    campaignName?: string,
  ): Promise<TrackingLinkWithAffiliate | null> {
    let query = db
      .from("affiliate_tracking_links")
      .select(
        `
        *,
        affiliate:affiliates ( id, name, email, pixel_id )
      `,
      )
      .eq("affiliate_id", affiliateId)
      .eq("store_id", storeId);

    if (campaignName) {
      query = query.eq("campaign_name", campaignName);
    } else {
      query = query.is("campaign_name", null);
    }

    const { data, error } = await query.single();

    if (error && error.code !== "PGRST116") {
      throw new AppError(error.message, 500);
    }
    return data ? this.mapToTrackingLink(data) : null;
  }

  /**
   * Get tracking links by affiliate
   */
  async getTrackingLinksByAffiliate(
    affiliateId: string,
    page: number,
    limit: number,
  ): Promise<PaginatedTrackingLinks> {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await db
      .from("affiliate_tracking_links")
      .select(
        `
        *,
        affiliate:affiliates ( id, name, email, pixel_id )
      `,
        { count: "exact" },
      )
      .eq("affiliate_id", affiliateId)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) throw new AppError(error.message, 500);

    return {
      data: (data || []).map((row: any) => this.mapToTrackingLink(row)),
      meta: {
        total: count ?? 0,
        page,
        limit,
        totalPages: Math.ceil((count ?? 0) / limit),
      },
    };
  }

  /**
   * Update a tracking link
   */
  async updateTrackingLink(
    id: string,
    dto: UpdateTrackingLinkDTO,
  ): Promise<TrackingLinkWithAffiliate> {
    const payload = Object.fromEntries(
      Object.entries({
        campaign_name: dto.campaignName,
        landing_page_url: dto.landingPageUrl,
        expires_at: dto.expiresAt,
        is_active: dto.isActive,
      }).filter(([, v]) => v !== undefined),
    );

    const { data, error } = await db
      .from("affiliate_tracking_links")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw new AppError("Tracking link not found", 404);
    return this.mapToTrackingLink(data);
  }

  /**
   * Delete a tracking link
   */
  async deleteTrackingLink(id: string): Promise<void> {
    const { error } = await db
      .from("affiliate_tracking_links")
      .delete()
      .eq("id", id);

    if (error) throw new AppError("Tracking link not found", 404);
  }

  /**
   * Record a click
   */
  async recordClick(
    affiliateId: string,
    storeId: string,
    referrerUrl?: string,
  ): Promise<{
    clickId: string;
    affiliateId: string;
    storeId: string;
    trackingLink: TrackingLinkWithAffiliate;
  }> {
    // Find or create tracking link
    let link = await this.getTrackingLinkByAffiliate(affiliateId, storeId);

    link ??= await this.createTrackingLink({
      affiliateId,
      storeId,
    });

    // Generate unique click ID
    const clickId = `clk_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

    // Increment click count
    await db
      .from("affiliate_tracking_links")
      .update({ click_count: (link.click_count || 0) + 1 })
      .eq("id", link.id);

    return {
      clickId,
      affiliateId,
      storeId,
      trackingLink: link,
    };
  }

  /**
   * Create an attribution record
   */
  async createAttribution(dto: {
    orderId: string;
    affiliateId?: string;
    trackingMethod: TrackingMethod;
    pixelId?: string;
    storeId?: string;
    clickId?: string;
    referrerUrl?: string;
  }): Promise<AttributionRecord> {
    const { data, error } = await db
      .from("affiliate_attributions")
      .insert({
        order_id: dto.orderId,
        affiliate_id: dto.affiliateId || null,
        tracking_method: dto.trackingMethod,
        pixel_id: dto.pixelId || null,
        store_id: dto.storeId || null,
        click_id: dto.clickId || null,
        referrer_url: dto.referrerUrl || null,
      })
      .select()
      .single();

    if (error) throw new AppError(error.message, 500);
    return this.mapToAttribution(data);
  }

  /**
   * Get attribution by order ID
   */
  async getAttributionByOrder(
    orderId: string,
  ): Promise<AttributionRecord | null> {
    const { data, error } = await db
      .from("affiliate_attributions")
      .select(
        `
        *,
        affiliate:affiliates ( id, name, email ),
        order:orders ( id, total, status )
      `,
      )
      .eq("order_id", orderId)
      .single();

    if (error && error.code !== "PGRST116") {
      throw new AppError(error.message, 500);
    }
    return data ? this.mapToAttribution(data) : null;
  }

  /**
   * Get attributions by affiliate
   */
  async getAttributionsByAffiliate(
    affiliateId: string,
    page: number,
    limit: number,
  ): Promise<PaginatedAttributions> {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await db
      .from("affiliate_attributions")
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
      data: (data || []).map((row: any) => this.mapToAttribution(row)),
      meta: {
        total: count ?? 0,
        page,
        limit,
        totalPages: Math.ceil((count ?? 0) / limit),
      },
    };
  }

  /**
   * Attribute order to affiliate
   */
  async attributeOrderToAffiliate(dto: {
    orderId: string;
    affiliateId: string;
    trackingMethod: TrackingMethod;
    clickId?: string;
  }): Promise<AttributionRecord> {
    // Update the order with affiliate_id
    const { error: orderError } = await db
      .from("orders")
      .update({
        affiliate_id: dto.affiliateId,
        tracking_method: dto.trackingMethod,
        click_id: dto.clickId || null,
      })
      .eq("id", dto.orderId);

    if (orderError) throw new AppError(orderError.message, 500);

    // Get affiliate for pixel_id
    const { data: affiliate } = await db
      .from("affiliates")
      .select("id, name, email, pixel_id, store_id")
      .eq("id", dto.affiliateId)
      .single();

    // Create attribution record
    const attribution = await this.createAttribution({
      orderId: dto.orderId,
      affiliateId: dto.affiliateId,
      trackingMethod: dto.trackingMethod,
      pixelId: affiliate?.pixel_id,
      storeId: affiliate?.store_id,
      clickId: dto.clickId,
    });

    return attribution;
  }

  /**
   * Get tracking statistics
   */
  async getTrackingStats(
    affiliateId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<TrackingStats> {
    // Get total clicks
    const { data: links } = await db
      .from("affiliate_tracking_links")
      .select("click_count, conversion_count")
      .eq("affiliate_id", affiliateId);

    const totalClicks =
      links?.reduce((sum: number, l: any) => sum + (l.click_count || 0), 0) ||
      0;
    const totalConversions =
      links?.reduce(
        (sum: number, l: any) => sum + (l.conversion_count || 0),
        0,
      ) || 0;

    // Get sales and commissions
    let salesQuery = db
      .from("affiliate_sales")
      .select("sale_amount, commission_earned, status")
      .eq("affiliate_id", affiliateId);

    if (startDate) {
      salesQuery = salesQuery.gte("created_at", startDate);
    }
    if (endDate) {
      salesQuery = salesQuery.lte("created_at", endDate);
    }

    const { data: sales } = await salesQuery;

    const approvedSales =
      sales?.filter((s: any) => s.status === "approved") || [];
    const totalSales = approvedSales.reduce(
      (sum: number, s: any) => sum + (s.sale_amount || 0),
      0,
    );
    const totalCommissions = approvedSales.reduce(
      (sum: number, s: any) => sum + (s.commission_earned || 0),
      0,
    );

    // Get recent clicks (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: recentAttributions } = await db
      .from("affiliate_attributions")
      .select("created_at")
      .eq("affiliate_id", affiliateId)
      .gte("created_at", sevenDaysAgo.toISOString());

    // Group by date
    const clicksByDate: Record<string, number> = {};
    const conversionsByDate: Record<string, number> = {};

    recentAttributions?.forEach((attr: any) => {
      const date = attr.created_at.split("T")[0];
      if (!clicksByDate[date]) clicksByDate[date] = 0;
      if (!conversionsByDate[date]) conversionsByDate[date] = 0;
      conversionsByDate[date]++;
    });

    // Fill in last 7 days
    const recentClicks: { date: string; count: number }[] = [];
    const recentConversions: { date: string; count: number }[] = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];

      recentClicks.push({
        date: dateStr,
        count: clicksByDate[dateStr] || 0,
      });
      recentConversions.push({
        date: dateStr,
        count: conversionsByDate[dateStr] || 0,
      });
    }

    return {
      affiliateId,
      totalClicks,
      totalConversions,
      conversionRate:
        totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0,
      totalSales,
      totalCommissions,
      recentClicks,
      recentConversions,
    };
  }

  /**
   * Increment conversion count
   */
  async incrementConversionCount(
    affiliateId: string,
    storeId: string,
  ): Promise<void> {
    await db
      .from("affiliate_tracking_links")
      .update({ conversion_count: db.raw("conversion_count + 1") })
      .eq("affiliate_id", affiliateId)
      .eq("store_id", storeId);
  }

  /**
   * Map database row to TrackingLinkWithAffiliate
   */
  private mapToTrackingLink(row: any): TrackingLinkWithAffiliate {
    return {
      id: row.id,
      affiliate_id: row.affiliate_id,
      store_id: row.store_id,
      campaign_name: row.campaign_name,
      landing_page_url: row.landing_page_url,
      click_count: row.click_count || 0,
      conversion_count: row.conversion_count || 0,
      is_active: row.is_active,
      expires_at: row.expires_at,
      created_at: row.created_at,
      updated_at: row.updated_at,
      affiliate: row.affiliate
        ? {
            id: row.affiliate.id,
            name: row.affiliate.name,
            email: row.affiliate.email,
            pixel_id: row.affiliate.pixel_id,
          }
        : undefined,
    };
  }

  /**
   * Map database row to AttributionRecord
   */
  private mapToAttribution(row: any): AttributionRecord {
    return {
      id: row.id,
      order_id: row.order_id,
      affiliate_id: row.affiliate_id,
      tracking_method: row.tracking_method as TrackingMethod,
      pixel_id: row.pixel_id,
      store_id: row.store_id,
      click_id: row.click_id,
      referrer_url: row.referrer_url,
      created_at: row.created_at,
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
