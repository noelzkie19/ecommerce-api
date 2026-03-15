import { Request, Response } from "express";
import { catchAsync } from "../../common/utils/catchAsync";
import { sendSuccess } from "../../common/utils/response";
import * as trackingService from "./affiliate-tracking.service";

// ── Tracking Links ───────────────────────────────────────────────────────────

export const generateTrackingLink = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { affiliateId, storeId, campaignName, landingPageUrl, expiresAt } =
      req.body;

    const link = await trackingService.generateTrackingLink({
      affiliateId,
      storeId,
      campaignName,
      landingPageUrl,
      expiresAt,
    });

    sendSuccess(res, link, "Tracking link generated", 201);
  },
);

export const getTrackingLinks = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const page = req.query.page as string | undefined;
    const limit = req.query.limit as string | undefined;

    const result = await trackingService.getTrackingLinks(
      id,
      page ? Number.parseInt(page, 10) : 1,
      limit ? Number.parseInt(limit, 10) : 20,
    );

    sendSuccess(res, result);
  },
);

export const getTrackingLink = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const link = await trackingService.getTrackingLink(id);
    sendSuccess(res, link);
  },
);

export const updateTrackingLink = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const { campaignName, landingPageUrl, expiresAt, isActive } = req.body;

    const link = await trackingService.updateTrackingLink(id, {
      campaignName,
      landingPageUrl,
      expiresAt,
      isActive,
    });

    sendSuccess(res, link, "Tracking link updated");
  },
);

export const deleteTrackingLink = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    await trackingService.deleteTrackingLink(id);
    res.status(204).send();
  },
);

// ── Attribution ─────────────────────────────────────────────────────────────

export const getAttributionByOrder = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const orderId = req.params.orderId as string;
    const attribution = await trackingService.getAttributionByOrder(orderId);
    sendSuccess(res, attribution);
  },
);

export const attributeOrder = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const orderId = req.params.orderId as string;
    const { affiliateId, clickId } = req.body;

    const attribution = await trackingService.attributeOrder(
      {
        orderId,
        affiliateId,
        trackingMethod: "manual",
        clickId,
      },
      { affiliateId, trackingMethod: "manual" },
    );

    sendSuccess(res, attribution, "Order attributed to affiliate", 201);
  },
);

export const getAttributions = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const page = req.query.page as string | undefined;
    const limit = req.query.limit as string | undefined;

    const result = await trackingService.getAttributionsByAffiliate(
      id,
      page ? Number.parseInt(page, 10) : 1,
      limit ? Number.parseInt(limit, 10) : 20,
    );

    sendSuccess(res, result);
  },
);

// ── Statistics ───────────────────────────────────────────────────────────

export const getTrackingStats = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;

    const stats = await trackingService.getTrackingStats(
      id,
      startDate,
      endDate,
    );

    sendSuccess(res, stats);
  },
);

// ── Cookie Configuration ─────────────────────────────────────────────────

export const getCookieConfig = catchAsync(
  async (_req: Request, res: Response): Promise<void> => {
    const cookieName = trackingService.getAffiliateCookieName();
    const cookieOptions = trackingService.getCookieOptions();

    sendSuccess(res, {
      cookieName,
      cookieOptions,
    });
  },
);

// ── Resolve ?ref= Store ID ─────────────────────────────────────────────────

export const resolveRef = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const ref = req.query.ref as string;

    if (!ref) {
      res
        .status(400)
        .json({ success: false, message: "ref query param is required" });
      return;
    }

    const result = await trackingService.resolveRef(ref);

    if (!result) {
      res
        .status(404)
        .json({ success: false, message: "Affiliate not found for this ref" });
      return;
    }

    sendSuccess(res, result);
  },
);
