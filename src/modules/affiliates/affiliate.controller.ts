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
    const user = (req as any).user;
    const userId = user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    let affiliate = await affiliateService.getAffiliateByUserId(userId);

    if (!affiliate) {
      const email = user.email ?? user.user_metadata?.email;
      const name =
        user.user_metadata?.full_name ??
        user.user_metadata?.name ??
        (email ? email.split("@")[0] : "Affiliate");
      if (!email) {
        res.status(404).json({
          success: false,
          message: "No affiliate record found",
        });
        return;
      }
      affiliate = await affiliateService.createAffiliateForAuthUser(
        userId,
        email,
        name,
      );
    }

    const linkCode =
      affiliate.affiliateLink ?? affiliate.affiliate_link ?? null;

    const effectiveStatus =
      affiliate.paymentStatus === "unpaid" ||
      affiliate.payment_status === "unpaid"
        ? "pending"
        : affiliate.status;

    sendSuccess(res, {
      id: affiliate.id,
      status: effectiveStatus,
      paymentStatus:
        affiliate.paymentStatus ?? affiliate.payment_status ?? "unpaid",
      email: affiliate.email,
      name: affiliate.name,
      storeId: buildStoreUrl(affiliate.store_id ?? affiliate.storeId),
      pixelId: affiliate.pixel_id ?? affiliate.pixelId,
      affiliateLink: linkCode
        ? `${process.env.FRONTEND_URL || "http://localhost:5173"}/register?ref=${linkCode}`
        : null,
      affiliateLinkCode: linkCode,
      createdAt: affiliate.created_at ?? affiliate.createdAt,
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

    // FIX: Frontend sends { referralCode } in the body.
    // Also support affiliateLink from query params as a fallback.
    const affiliateLink =
      (req.body.referralCode as string | undefined) ||
      (req.query.affiliateLink as string | undefined) ||
      (req.body.affiliateLink as string | undefined) ||
      undefined;

    const result = await affiliateService.createAffiliatePayment(
      userId,
      userEmail,
      userFullName,
      affiliateLink,
    );
    sendSuccess(res, result, "Payment initiated");
  },
);

export const verifyAffiliatePayment = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { intentId, userId, affiliateLink } = req.query;

    if (!intentId || !userId) {
      const redirectUrl = `${env.FRONTEND_URL}/affiliate/registration/callback?error=missing_params`;
      return res.redirect(redirectUrl);
    }

    const result = await affiliateService.verifyAffiliatePayment(
      intentId as string,
      userId as string,
      affiliateLink as string | undefined,
    );

    if (result.success) {
      const redirectUrl = `${env.FRONTEND_URL}/affiliate/registration/callback?status=success`;
      return res.redirect(redirectUrl);
    } else {
      const redirectUrl = `${env.FRONTEND_URL}/affiliate/registration/callback?error=payment_failed&status=${result.status}`;
      return res.redirect(redirectUrl);
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

      const metadata = event.data?.attributes?.metadata as
        | { user_id?: string; affiliate_link?: string }
        | undefined;
      const userId = metadata?.user_id;
      const affiliateLink =
        metadata?.affiliate_link && metadata.affiliate_link.trim() !== ""
          ? metadata.affiliate_link
          : undefined;

      if (intentId && userId) {
        await affiliateService.verifyAffiliatePayment(
          intentId,
          userId,
          affiliateLink,
        );
      } else {
        sendSuccess(res, null, "Webhook received - missing metadata");
      }
    }

    sendSuccess(res, null, "Webhook received");
  },
);

// ── Affiliate Settings (Admin) ─────────────────────────────────────────────────

export const getAffiliateSettings = catchAsync(
  async (_req: Request, res: Response): Promise<void> => {
    const settings = await affiliateService.getAffiliateSettings();
    sendSuccess(res, settings);
  },
);

export const updateAffiliateSettings = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { registrationFee, referralCommissionRate, referralCommissionType } =
      req.body;

    const settings = await affiliateService.updateAffiliateSettings(
      registrationFee,
      referralCommissionRate,
      referralCommissionType,
    );
    sendSuccess(res, settings, "Settings updated successfully");
  },
);

// ── Affiliate Link ───────────────────────────────────────────────────────────

export const getMyAffiliateLink = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user?.id;
    if (!userId) {
      throw new AppError("Unauthorized", 401);
    }

    const result = await affiliateService.getMyAffiliateLink(userId);
    sendSuccess(res, result);
  },
);

// ── Manual Referral (Admin/Testing) ─────────────────────────────────────────────

export const setAffiliateReferrer = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { affiliateId, referrerId } = req.body;

    if (!affiliateId || !referrerId) {
      throw new AppError("Both affiliateId and referrerId are required", 400);
    }

    await affiliateService.setAffiliateReferrer(affiliateId, referrerId);
    sendSuccess(res, null, "Referrer updated successfully");
  },
);

export const triggerReferralCommission = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { affiliateId, paymentAmount } = req.body;

    if (!affiliateId || !paymentAmount) {
      throw new AppError(
        "Both affiliateId and paymentAmount are required",
        400,
      );
    }

    const result = await affiliateService.recordReferralCommission(
      affiliateId,
      paymentAmount,
    );

    if (!result) {
      throw new AppError(
        "No referral commission recorded. Check if the affiliate has a referrer.",
        400,
      );
    }

    sendSuccess(res, result, "Referral commission recorded");
  },
);

// ── Add Commission by Referral Code (Admin) ─────────────────────────────────

export const addCommissionByReferralCode = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { referralCode } = req.body;

    if (!referralCode) {
      throw new AppError("referralCode is required", 400);
    }

    const result =
      await affiliateService.addCommissionByReferralCode(referralCode);

    sendSuccess(res, result, "Commission added successfully");
  },
);
