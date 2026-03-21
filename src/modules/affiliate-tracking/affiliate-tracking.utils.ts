import { env } from "../../config/env";
import { TrackingMethod } from "../../application/use-cases/affiliate-tracking";

// ── Constants ───────────────────────────────────────────────────────────────────

const AFFILIATE_COOKIE_NAME = process.env.AFFILIATE_COOKIE_NAME || "aft";
const COOKIE_MAX_AGE = Number.parseInt(
  process.env.AFFILIATE_COOKIE_MAX_AGE || "2592000",
  10,
); // 30 days

export interface AttributionData {
  affiliateId?: string;
  pixelId?: string;
  storeId?: string;
  clickId?: string;
  trackingMethod: TrackingMethod | "none";
  referrerUrl?: string;
}

// ── Cookie Attribution ───────────────────────────────────────────────────────

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

// ── Cookie Creation ─────────────────────────────────────────────────────────

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

// ── Cookie Configuration ───────────────────────────────────────────────────

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

export const getAffiliateCookieName = () => AFFILIATE_COOKIE_NAME;
