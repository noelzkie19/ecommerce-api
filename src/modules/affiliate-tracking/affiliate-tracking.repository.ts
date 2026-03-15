import { supabaseAdmin } from "../../config/supabase";
import { AppError } from "../../common/utils/AppError";
import {
  CreateTrackingLinkDTO,
  UpdateTrackingLinkDTO,
  AttributeOrderDTO,
  TrackingMethod,
} from "./affiliate-tracking.types";

const db = supabaseAdmin as any;

// ── Tracking Links ───────────────────────────────────────────────────────────

export const createTrackingLink = async (dto: CreateTrackingLinkDTO) => {
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
  return data;
};

export const getTrackingLink = async (id: string) => {
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

  if (error) throw new AppError("Tracking link not found", 404);
  return data;
};

export const getTrackingLinkByAffiliate = async (
  affiliateId: string,
  storeId: string,
  campaignName?: string,
) => {
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
  return data || null;
};

export const getTrackingLinksByAffiliate = async (
  affiliateId: string,
  page: number = 1,
  limit: number = 20,
) => {
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
    data: data || [],
    meta: {
      total: count ?? 0,
      page,
      limit,
      totalPages: Math.ceil((count ?? 0) / limit),
    },
  };
};

export const updateTrackingLink = async (
  id: string,
  dto: UpdateTrackingLinkDTO,
) => {
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
  return data;
};

export const deleteTrackingLink = async (id: string) => {
  const { error } = await db
    .from("affiliate_tracking_links")
    .delete()
    .eq("id", id);

  if (error) throw new AppError("Tracking link not found", 404);
};

// ── Click Recording ───────────────────────────────────────────────────────────

export const recordClick = async (
  affiliateId: string,
  storeId: string,
  referrerUrl?: string,
) => {
  // Find or create tracking link
  let link = await getTrackingLinkByAffiliate(affiliateId, storeId);

  if (!link) {
    link = await createTrackingLink({
      affiliateId,
      storeId,
    });
  }

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
};

// ── Attributions ───────────────────────────────────────────────────────────

export const createAttribution = async (dto: {
  orderId: string;
  affiliateId?: string;
  trackingMethod: TrackingMethod;
  pixelId?: string;
  storeId?: string;
  clickId?: string;
  referrerUrl?: string;
}) => {
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
  return data;
};

export const getAttributionByOrder = async (orderId: string) => {
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
  return data || null;
};

export const getAttributionsByAffiliate = async (
  affiliateId: string,
  page: number = 1,
  limit: number = 20,
) => {
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
    data: data || [],
    meta: {
      total: count ?? 0,
      page,
      limit,
      totalPages: Math.ceil((count ?? 0) / limit),
    },
  };
};

// ── Order Attribution ───────────────────────────────────────────────────────

export const attributeOrderToAffiliate = async (dto: AttributeOrderDTO) => {
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
  const attribution = await createAttribution({
    orderId: dto.orderId,
    affiliateId: dto.affiliateId,
    trackingMethod: dto.trackingMethod,
    pixelId: affiliate?.pixel_id,
    storeId: affiliate?.store_id,
    clickId: dto.clickId,
  });

  return attribution;
};

// ── Statistics ───────────────────────────────────────────────────────────────

export const getTrackingStats = async (
  affiliateId: string,
  startDate?: string,
  endDate?: string,
) => {
  // Get total clicks
  const { data: links } = await db
    .from("affiliate_tracking_links")
    .select("click_count, conversion_count")
    .eq("affiliate_id", affiliateId);

  const totalClicks =
    links?.reduce((sum: number, l: any) => sum + (l.click_count || 0), 0) || 0;
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
};

// ── Increment Conversion Count ────────────────────────────────────────────

export const incrementConversionCount = async (
  affiliateId: string,
  storeId: string,
) => {
  await db
    .from("affiliate_tracking_links")
    .update({ conversion_count: db.raw("conversion_count + 1") })
    .eq("affiliate_id", affiliateId)
    .eq("store_id", storeId);
};
