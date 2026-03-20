import { Request, Response } from "express";
import { catchAsync } from "../../common/utils/catchAsync";
import { sendSuccess } from "../../common/utils/response";
import * as useCases from "../../application/use-cases/affiliate-tracking";
import {
  getAffiliateCookieName,
  getCookieOptions,
} from "./affiliate-tracking.utils";

// ── Tracking Links ───────────────────────────────────────────────────────────

export const generateTrackingLink = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { affiliateId, storeId, campaignName, landingPageUrl, expiresAt } =
      req.body;

    const link = await useCases.generateTrackingLink({
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

    const result = await useCases.getTrackingLinks({
      affiliateId: id,
      page: page ? Number.parseInt(page, 10) : undefined,
      limit: limit ? Number.parseInt(limit, 10) : undefined,
    });

    sendSuccess(res, result);
  },
);

export const getTrackingLink = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const link = await useCases.getTrackingLink({ id });
    sendSuccess(res, link);
  },
);

export const updateTrackingLink = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const { campaignName, landingPageUrl, expiresAt, isActive } = req.body;

    const link = await useCases.updateTrackingLink({
      id,
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
    await useCases.deleteTrackingLink({ id });
    res.status(204).send();
  },
);

// ── Attribution ─────────────────────────────────────────────────────────────

export const getAttributionByOrder = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const orderId = req.params.orderId as string;
    const attribution = await useCases.getAttributionByOrder({ orderId });
    sendSuccess(res, attribution);
  },
);

export const attributeOrder = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const orderId = req.params.orderId as string;
    const { affiliateId, clickId } = req.body;

    const attribution = await useCases.attributeOrder({
      orderId,
      affiliateId,
      clickId,
    });

    sendSuccess(res, attribution, "Order attributed to affiliate", 201);
  },
);

export const getAttributions = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const page = req.query.page as string | undefined;
    const limit = req.query.limit as string | undefined;

    const result = await useCases.getAttributions({
      affiliateId: id,
      page: page ? Number.parseInt(page, 10) : undefined,
      limit: limit ? Number.parseInt(limit, 10) : undefined,
    });

    sendSuccess(res, result);
  },
);

// ── Statistics ───────────────────────────────────────────────────────────

export const getTrackingStats = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;

    const stats = await useCases.getTrackingStats({
      affiliateId: id,
      startDate,
      endDate,
    });

    sendSuccess(res, stats);
  },
);

// ── Cookie Configuration ─────────────────────────────────────────────────

export const getCookieConfig = catchAsync(
  async (_req: Request, res: Response): Promise<void> => {
    const cookieName = getAffiliateCookieName();
    const cookieOptions = getCookieOptions();

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

    const result = await useCases.resolveRef({ storeId: ref });

    if (!result) {
      res
        .status(404)
        .json({ success: false, message: "Affiliate not found for this ref" });
      return;
    }

    sendSuccess(res, result);
  },
);
