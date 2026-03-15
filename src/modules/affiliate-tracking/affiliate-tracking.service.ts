import * as trackingRepository from "./affiliate-tracking.repository";
import * as affiliateRepository from "../affiliates/affiliate.repository";
import { AppError } from "../../common/utils/AppError";
import {
  CreateTrackingLinkDTO,
  UpdateTrackingLinkDTO,
  AttributeOrderDTO,
  AttributionData,
  TrackingMethod,
} from "./affiliate-tracking.types";
import { env } from "../../config/env";

// ── Constants ───────────────────────────────────────────────────────────────────

const AFFILIATE_COOKIE_NAME = process.env.AFFILIATE_COOKIE_NAME || "aft";
const COOKIE_MAX_AGE = Number.parseInt(
  process.env.AFFILIATE_COOKIE_MAX_AGE || "2592000",
  10,
); // 30 days

// ── Tracking Link Generation ────────────────────────────────────────────────

export const generateTrackingLink = async (dto: CreateTrackingLinkDTO) => {
  // Validate affiliate exists
  const affiliate = await affiliateRepository.findById(dto.affiliateId);

  // Check if link already exists
  const existing = await trackingRepository.getTrackingLinkByAffiliate(
    dto.affiliateId,
    dto.storeId,
    dto.campaignName,
  );

  if (existing) {
    // Return existing link with updated info
    return trackingRepository.updateTrackingLink(existing.id, {
      campaignName: dto.campaignName,
      landingPageUrl: dto.landingPageUrl,
      expiresAt: dto.expiresAt,
    });
  }

  // Create new tracking link
  const link = await trackingRepository.createTrackingLink(dto);

  // Generate the full tracking URL
  const baseUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  const trackingUrl = `${baseUrl}?affiliate_id=${affiliate.id}&store_id=${dto.storeId}`;

  return {
    ...link,
    trackingUrl,
  };
};

export const getTrackingLinks = (
  affiliateId: string,
  page: number = 1,
  limit: number = 20,
) => trackingRepository.getTrackingLinksByAffiliate(affiliateId, page, limit);

export const getTrackingLink = (id: string) =>
  trackingRepository.getTrackingLink(id);

export const updateTrackingLink = (id: string, dto: UpdateTrackingLinkDTO) =>
  trackingRepository.updateTrackingLink(id, dto);

export const deleteTrackingLink = (id: string) =>
  trackingRepository.deleteTrackingLink(id);

// ── Click Recording ───────────────────────────────────────────────────────────

export const recordClick = async (
  affiliateId: string,
  storeId: string,
  referrerUrl?: string,
) => {
  // Validate affiliate exists and is active
  const affiliate = await affiliateRepository.findById(affiliateId);

  if (affiliate.status !== "active") {
    throw new AppError("Affiliate is not active", 400);
  }

  return trackingRepository.recordClick(affiliateId, storeId, referrerUrl);
};

// ── Attribution ─────────────────────────────────────────────────────────────

export const getAttributionFromCookie = (
  cookieValue: string,
): AttributionData | null => {
  try {
    const decoded = Buffer.from(cookieValue, "base64").toString("utf-8");
    const data = JSON.parse(decoded);

    // Validate cookie is not expired (30 days)
    const maxAge = process.env.AFFILIATE_COOKIE_MAX_AGE
      ? Number.parseInt(process.env.AFFILIATE_COOKIE_MAX_AGE, 10)
      : COOKIE_MAX_AGE;
    if (Date.now() - data.ts > maxAge) {
      return null;
    }

    return {
      affiliateId: data.aid,
      pixelId: data.pid,
      storeId: data.sid,
      clickId: data.cid,
      trackingMethod: "cookie" as TrackingMethod,
      referrerUrl: undefined,
    };
  } catch {
    return null;
  }
};

export const getAttributionFromUrl = (
  query: Record<string, string>,
): AttributionData | null => {
  const affiliateId = query.affiliate_id || query.aff;
  // ?ref= is the short-form store_id used in affiliate share links
  const storeId = query.store_id || query.sid || query.ref;
  const pixelId = query.pixel_id || query.pid;
  const clickId = query.click_id || query.cid;

  if (!affiliateId && !storeId) {
    return null;
  }

  return {
    affiliateId,
    pixelId,
    storeId,
    clickId,
    trackingMethod: "url_param" as TrackingMethod,
    referrerUrl: undefined,
  };
};

export const mergeAttribution = (
  cookieData: AttributionData | null,
  urlData: AttributionData | null,
): AttributionData => {
  // URL params take precedence over cookies
  if (urlData?.affiliateId) {
    return urlData;
  }

  if (cookieData?.affiliateId) {
    return cookieData;
  }

  return {
    trackingMethod: "none",
  };
};

export const createAffiliateCookie = (data: {
  affiliateId: string;
  pixelId?: string;
  storeId?: string;
  clickId?: string;
}): string => {
  const cookieData = {
    aid: data.affiliateId,
    pid: data.pixelId || "",
    sid: data.storeId || "",
    cid: data.clickId || "",
    ts: Date.now(),
  };

  return Buffer.from(JSON.stringify(cookieData)).toString("base64");
};

export const getCookieOptions = () => {
  const isProduction = env.NODE_ENV === "production";
  return {
    httpOnly: false, // Needs to be accessible by JavaScript for frontend
    secure: isProduction,
    sameSite: "Lax" as const,
    maxAge: process.env.AFFILIATE_COOKIE_MAX_AGE
      ? Number.parseInt(process.env.AFFILIATE_COOKIE_MAX_AGE, 10)
      : COOKIE_MAX_AGE,
    path: "/",
  };
};

// ── Order Attribution ───────────────────────────────────────────────────────

export const attributeOrder = async (
  dto: AttributeOrderDTO,
  attributionData: AttributionData,
) => {
  // Validate affiliate exists
  const affiliate = await affiliateRepository.findById(dto.affiliateId);

  if (affiliate.status !== "active") {
    throw new AppError("Cannot attribute order to inactive affiliate", 400);
  }

  // Create attribution in database
  const attribution = await trackingRepository.attributeOrderToAffiliate({
    ...dto,
    trackingMethod: dto.trackingMethod,
  });

  // Increment conversion count
  if (attributionData.storeId) {
    await trackingRepository.incrementConversionCount(
      dto.affiliateId,
      attributionData.storeId,
    );
  }

  return attribution;
};

export const attributeOrderFromData = async (
  orderId: string,
  attributionData: AttributionData,
) => {
  if (
    !attributionData.affiliateId ||
    attributionData.trackingMethod === "none"
  ) {
    return null;
  }

  return attributeOrder(
    {
      orderId,
      affiliateId: attributionData.affiliateId,
      trackingMethod: attributionData.trackingMethod,
      clickId: attributionData.clickId,
    },
    attributionData,
  );
};

// ── Attribution Retrieval ─────────────────────────────────────────────────

export const getAttributionByOrder = (orderId: string) =>
  trackingRepository.getAttributionByOrder(orderId);

export const getAttributionsByAffiliate = (
  affiliateId: string,
  page: number = 1,
  limit: number = 20,
) => trackingRepository.getAttributionsByAffiliate(affiliateId, page, limit);

// ── Statistics ─────────────────────────────────────────────────────────────

export const getTrackingStats = async (
  affiliateId: string,
  startDate?: string,
  endDate?: string,
) => {
  // Validate affiliate exists
  await affiliateRepository.findById(affiliateId);

  return trackingRepository.getTrackingStats(affiliateId, startDate, endDate);
};

// ── Cookie Name Export ─────────────────────────────────────────────────────

export const getAffiliateCookieName = () => AFFILIATE_COOKIE_NAME;

// ── Resolve ?ref= Store ID ─────────────────────────────────────────────────

/**
 * Resolve a ?ref=store_id to full affiliate attribution data.
 * Used by the frontend when it detects a ?ref= query param on page load.
 * Returns affiliateId, pixelId, and storeId so the frontend can:
 *   1. Fire the Meta Pixel PageView event
 *   2. Store the attribution cookie for later order attribution
 */
export const resolveRef = async (storeId: string) => {
  const affiliate = await affiliateRepository.findByStoreId(storeId);

  if (!affiliate) {
    return null;
  }

  return {
    affiliateId: affiliate.id,
    pixelId: affiliate.pixel_id ?? null,
    storeId: affiliate.store_id,
    affiliateName: affiliate.name,
  };
};
