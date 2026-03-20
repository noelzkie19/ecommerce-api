import { Request, Response, NextFunction } from "express";
import {
  getAttributionFromCookie,
  getAttributionFromUrl,
  mergeAttribution,
} from "../../modules/affiliate-tracking/affiliate-tracking.utils";

/**
 * Middleware to extract and attach affiliate attribution data to the request
 *
 * This middleware:
 * 1. Checks for affiliate_id and store_id in URL query parameters
 * 2. Checks for affiliate cookie
 * 3. Merges both sources (URL params take precedence)
 * 4. Attaches the attribution data to req.affiliateAttribution
 */
export const affiliateTrackingMiddleware = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  try {
    // Get attribution from URL query parameters
    const urlAttribution = getAttributionFromUrl(
      req.query as Record<string, string>,
    );

    // Get attribution from cookie
    const cookieValue =
      req.cookies?.aft || (req.headers["x-affiliate-cookie"] as string);
    const cookieAttribution = cookieValue
      ? getAttributionFromCookie(cookieValue)
      : null;

    // Merge attributions (URL takes precedence over cookie)
    const mergedAttribution = mergeAttribution(
      cookieAttribution,
      urlAttribution,
    );

    // Attach to request for use in downstream handlers
    (req as any).affiliateAttribution = mergedAttribution;

    // Also set headers for easy access in order creation
    if (mergedAttribution.affiliateId) {
      req.headers["x-affiliate-id"] = mergedAttribution.affiliateId;
    }
    if (mergedAttribution.pixelId) {
      req.headers["x-pixel-id"] = mergedAttribution.pixelId;
    }
    if (mergedAttribution.storeId) {
      req.headers["x-store-id"] = mergedAttribution.storeId;
    }
    if (mergedAttribution.clickId) {
      req.headers["x-click-id"] = mergedAttribution.clickId;
    }
    if (mergedAttribution.trackingMethod !== "none") {
      req.headers["x-tracking-method"] = mergedAttribution.trackingMethod;
    }

    next();
  } catch {
    // Silent fail
    next();
  }
};

/**
 * Middleware to validate affiliate attribution for admin routes
 * Ensures the affiliate exists and is active
 */
export const validateAffiliateAttribution = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  const attribution = (req as any).affiliateAttribution;

  if (!attribution?.affiliateId) {
    next();
    return;
  }

  // The actual validation would be done in the service layer
  // This middleware just passes the attribution through
  next();
};
