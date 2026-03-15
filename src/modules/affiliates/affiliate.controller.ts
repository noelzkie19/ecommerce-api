import { Request, Response } from "express";
import { catchAsync } from "../../common/utils/catchAsync";
import { sendSuccess } from "../../common/utils/response";
import { AppError } from "../../common/utils/AppError";
import * as affiliateService from "./affiliate.service";
import { env } from "../../config/env";

const buildStoreUrl = (storeId: string | null | undefined): string | null => {
  if (!storeId) return null;
  return `${env.FRONTEND_URL}?ref=${storeId}`;
};

import {
  validateCreateAffiliate,
  validateUpdateAffiliate,
  validateAssignProduct,
  validateAffiliateIdParam,
  validateAffiliateProductParam,
  validateAffiliatePaginatedQuery,
} from "../../common/validators/affiliate.validator";

// ── Affiliates ────────────────────────────────────────────────────────────────

export const getAffiliates = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { page, limit, search, status } = validateAffiliatePaginatedQuery(
      req.query,
    );
    const result = await affiliateService.getAffiliates(
      page,
      limit,
      search,
      status,
    );
    sendSuccess(res, result);
  },
);

export const getAffiliate = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = validateAffiliateIdParam(req.params);
    const affiliate = await affiliateService.getAffiliate(id);
    sendSuccess(res, affiliate);
  },
);

export const createAffiliate = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const dto = validateCreateAffiliate(req.body);
    const affiliate = await affiliateService.createAffiliate(dto);
    res.status(201).json({ success: true, data: affiliate });
  },
);

export const updateAffiliate = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = validateAffiliateIdParam(req.params);
    const dto = validateUpdateAffiliate(req.body);
    const affiliate = await affiliateService.updateAffiliate(id, dto);
    sendSuccess(res, affiliate);
  },
);

export const suspendAffiliate = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = validateAffiliateIdParam(req.params);
    const affiliate = await affiliateService.suspendAffiliate(id);
    sendSuccess(res, affiliate, "Affiliate suspended");
  },
);

export const activateAffiliate = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = validateAffiliateIdParam(req.params);

    // Check if affiliate has paid before activating
    const affiliate = await affiliateService.getAffiliate(id);
    if (affiliate.paymentStatus !== "paid") {
      res.status(400).json({
        success: false,
        message: "Affiliate must complete payment before activation",
      });
      return;
    }

    const updated = await affiliateService.activateAffiliate(id);
    sendSuccess(res, updated, "Affiliate activated");
  },
);

// ── Update Current User's Pixel ID ───────────────────────────────────────────

export const updateMyPixelId = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const { pixelId } = req.body;
    if (!pixelId || typeof pixelId !== "string") {
      res.status(400).json({ success: false, message: "pixelId is required" });
      return;
    }

    const affiliate = await affiliateService.updateMyPixelId(userId, pixelId);
    sendSuccess(
      res,
      {
        id: affiliate.id,
        status: affiliate.status,
        paymentStatus: affiliate.paymentStatus,
        email: affiliate.email,
        name: affiliate.name,
        storeId: buildStoreUrl(affiliate.store_id),
        pixelId: affiliate.pixel_id,
        createdAt: affiliate.created_at,
      },
      "Pixel ID updated",
    );
  },
);

// ── Get Current User's Affiliate Status ───────────────────────────────────────

export const getMyAffiliateStatus = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const affiliate = await affiliateService.getAffiliateByUserId(userId);
    if (!affiliate) {
      res.status(404).json({
        success: false,
        message: "No affiliate record found",
      });
      return;
    }

    sendSuccess(res, {
      id: affiliate.id,
      status: affiliate.status,
      paymentStatus: affiliate.paymentStatus,
      email: affiliate.email,
      name: affiliate.name,
      storeId: buildStoreUrl(affiliate.store_id),
      pixelId: affiliate.pixel_id,
      createdAt: affiliate.created_at,
    });
  },
);

export const deleteAffiliate = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = validateAffiliateIdParam(req.params);
    await affiliateService.deleteAffiliate(id);
    res.status(204).send();
  },
);

// ── Affiliate Products ────────────────────────────────────────────────────────

export const getAffiliateProducts = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = validateAffiliateIdParam(req.params);
    const products = await affiliateService.getAffiliateProducts(id);
    sendSuccess(res, products);
  },
);

export const assignProduct = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = validateAffiliateIdParam(req.params);
    const dto = validateAssignProduct(req.body);
    const result = await affiliateService.assignProduct(id, dto);
    res.status(201).json({ success: true, data: result });
  },
);

export const removeProduct = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { id, productId } = validateAffiliateProductParam(req.params);
    await affiliateService.removeProductFromAffiliate(id, productId);
    res.status(204).send();
  },
);

// ── Affiliate Registration Payment ────────────────────────────────────────────

export const createAffiliatePayment = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user?.id;
    const userEmail = (req as any).user?.email;
    const userFullName =
      (req as any).user?.fullName ||
      (req as any).user?.user_metadata?.full_name ||
      userEmail?.split("@")[0];

    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const result = await affiliateService.createAffiliatePayment(
      userId,
      userEmail,
      userFullName,
    );
    sendSuccess(res, result, "Payment initiated");
  },
);

export const verifyAffiliatePayment = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { intentId, userId } = req.query;

    if (!intentId || !userId) {
      res
        .status(400)
        .json({ success: false, message: "Missing intentId or userId" });
      return;
    }

    const result = await affiliateService.verifyAffiliatePayment(
      intentId as string,
      userId as string,
    );

    if (result.success) {
      sendSuccess(res, result, "Payment verified successfully");
    } else {
      res
        .status(400)
        .json({ success: false, message: `Payment status: ${result.status}` });
    }
  },
);

// ── PayMongo Webhook for Affiliate Payments ───────────────────────────────────

export const paymongoWebhook = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const event = req.body?.data?.attributes;

    if (!event) {
      throw new AppError("Invalid webhook payload", 400);
    }

    if (event.type === "payment.paid") {
      const intentId = event.data?.attributes?.payment_intent_id as
        | string
        | undefined;

      // Extract user_id from metadata that we passed when creating the payment
      const metadata = event.data?.attributes?.metadata as
        | { user_id?: string }
        | undefined;
      const userId = metadata?.user_id;

      if (intentId && userId) {
        await affiliateService.verifyAffiliatePayment(intentId, userId);
      } else {
        console.warn(
          "[Affiliate Webhook] Missing intentId or userId in metadata",
        );
      }
    }

    // Always return 200 so PayMongo doesn't retry
    sendSuccess(res, null, "Webhook received");
  },
);
