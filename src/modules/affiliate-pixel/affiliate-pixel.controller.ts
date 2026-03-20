import { Request, Response } from "express";
import { catchAsync } from "../../common/utils/catchAsync";
import { sendSuccess } from "../../common/utils/response";
import * as useCases from "../../application/use-cases/affiliate-pixel";

// ── Pixel Configuration ─────────────────────────────────────────────────

export const getPixelConfig = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const config = await useCases.getAffiliatePixelConfig({ affiliateId: id });
    sendSuccess(res, config);
  },
);

export const updatePixelConfig = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const {
      pixelId,
      pixelAccessToken,
      enablePurchaseEvent,
      enableLeadEvent,
      conversionValueType,
      conversionValueFixed,
    } = req.body;

    const config = await useCases.updateAffiliatePixelConfig({
      affiliateId: id,
      pixelId,
      pixelAccessToken,
      enablePurchaseEvent,
      enableLeadEvent,
      conversionValueType,
      conversionValueFixed,
    });

    sendSuccess(res, config, "Pixel configuration updated");
  },
);

export const testPixelConfig = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { pixelId, testEventCode } = req.body;

    const result = await useCases.testPixelConfig({ pixelId, testEventCode });

    if (result.success) {
      sendSuccess(res, result, "Test event sent successfully");
    } else {
      sendSuccess(res, result, "Test event failed", 400);
    }
  },
);

// ── Pixel Events ────────────────────────────────────────────────────────

export const getPixelEvents = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const page = req.query.page as string | undefined;
    const limit = req.query.limit as string | undefined;

    const result = await useCases.getPixelEvents({
      affiliateId: id,
      page: page ? Number.parseInt(page, 10) : undefined,
      limit: limit ? Number.parseInt(limit, 10) : undefined,
    });

    sendSuccess(res, result);
  },
);

export const firePurchaseEvent = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { orderId, affiliateId } = req.body;

    const result = await useCases.firePurchaseEvent({ orderId, affiliateId });

    if (result.success) {
      sendSuccess(res, result, "Purchase event fired successfully");
    } else {
      sendSuccess(
        res,
        result,
        result.error || "Failed to fire purchase event",
        400,
      );
    }
  },
);

export const fireLeadEvent = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { orderId, affiliateId } = req.body;

    const result = await useCases.fireLeadEvent({ orderId, affiliateId });

    if (result.success) {
      sendSuccess(res, result, "Lead event fired successfully");
    } else {
      sendSuccess(
        res,
        result,
        result.error || "Failed to fire lead event",
        400,
      );
    }
  },
);

// ── Retry Failed Events ─────────────────────────────────────────────────

export const retryFailedEvents = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const limit = req.query.limit
      ? Number.parseInt(req.query.limit as string, 10)
      : 10;

    const result = await useCases.retryFailedEvents({ limit });
    sendSuccess(res, result, "Failed events retry completed");
  },
);
