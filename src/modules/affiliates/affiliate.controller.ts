/**
 * Affiliate Controller
 *
 * Handles HTTP requests for affiliate endpoints.
 */

import { Request, Response } from "express";
import { catchAsync } from "../../common/utils/catchAsync";
import { sendSuccess } from "../../common/utils/response";
import { AppError } from "../../common/utils/AppError";
import { env } from "../../config/env";

import {
  ListAffiliatesUseCase,
  GetAffiliateUseCase,
  CreateAffiliateUseCase,
  UpdateAffiliateUseCase,
  DeleteAffiliateUseCase,
  SuspendAffiliateUseCase,
  ActivateAffiliateUseCase,
  GetAffiliateProductsUseCase,
  AssignProductUseCase,
  RemoveProductUseCase,
  GenerateAffiliateLinkUseCase,
  GetAffiliateByUserIdUseCase,
  UpdateMyPixelIdUseCase,
  CreateAffiliatePaymentUseCase,
  VerifyAffiliatePaymentUseCase,
  GetAffiliateSettingsUseCase,
  UpdateAffiliateSettingsUseCase,
  SetAffiliateReferrerUseCase,
  RecordReferralCommissionUseCase,
  AddCommissionByReferralCodeUseCase,
} from "../../application/use-cases/affiliate";

import {
  validateCreateAffiliate,
  validateUpdateAffiliate,
  validateAssignProduct,
  validateAffiliateIdParam,
  validateAffiliateProductParam,
  validateAffiliatePaginatedQuery,
} from "../../common/validators/affiliate.validator";

const buildStoreUrl = (storeId: string | null | undefined): string | null => {
  if (!storeId) return null;
  return `${env.FRONTEND_URL}?ref=${storeId}`;
};

// ── Affiliates ────────────────────────────────────────────────────────────────

export const getAffiliates = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { page, limit, search, status } = validateAffiliatePaginatedQuery(
      req.query,
    );

    const useCase = new ListAffiliatesUseCase();
    const result = await useCase.execute({ page, limit, search, status });

    sendSuccess(res, result);
  },
);

export const getAffiliate = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = validateAffiliateIdParam(req.params);

    const useCase = new GetAffiliateUseCase();
    const affiliate = await useCase.execute({ affiliateId: id });

    sendSuccess(res, affiliate);
  },
);

export const createAffiliate = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    // Validate with the validator first
    validateCreateAffiliate(req.body);

    // Get values from body - validator ensures email exists
    const { email, name } = req.body as { email: string; name?: string };

    const useCase = new CreateAffiliateUseCase();
    const affiliate = await useCase.execute({
      userId: "", // Admin-created affiliates don't have a userId yet
      email,
      name: name || email.split("@")[0],
    });

    res.status(201).json({ success: true, data: affiliate });
  },
);

export const updateAffiliate = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = validateAffiliateIdParam(req.params);
    const dto = validateUpdateAffiliate(req.body);

    const useCase = new UpdateAffiliateUseCase();
    const affiliate = await useCase.execute({ affiliateId: id, ...dto });

    sendSuccess(res, affiliate);
  },
);

export const suspendAffiliate = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = validateAffiliateIdParam(req.params);

    const useCase = new SuspendAffiliateUseCase();
    const affiliate = await useCase.execute({ affiliateId: id });

    sendSuccess(res, affiliate, "Affiliate suspended");
  },
);

export const activateAffiliate = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = validateAffiliateIdParam(req.params);

    // First get to check payment status
    const getUseCase = new GetAffiliateUseCase();
    const affiliate = await getUseCase.execute({ affiliateId: id });

    if (!affiliate?.paymentStatus || affiliate.paymentStatus !== "paid") {
      res.status(400).json({
        success: false,
        message: "Affiliate must complete payment before activation",
      });
      return;
    }

    const useCase = new ActivateAffiliateUseCase();
    const updated = await useCase.execute({ affiliateId: id });

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

    const useCase = new UpdateMyPixelIdUseCase();
    const affiliate = await useCase.execute({ userId, pixelId });
    sendSuccess(
      res,
      {
        id: affiliate.id,
        status: affiliate.status,
        paymentStatus: affiliate.paymentStatus,
        email: affiliate.email,
        name: affiliate.name,
        storeId: buildStoreUrl(affiliate.storeId),
        pixelId: affiliate.pixelId,
        createdAt: affiliate.createdAt,
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

    let affiliate;

    // Try to get existing affiliate
    const getByUserIdUseCase = new GetAffiliateByUserIdUseCase();
    try {
      affiliate = await getByUserIdUseCase.execute({ userId });
    } catch {
      affiliate = null;
    }

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
      // Create affiliate for auth user
      const createUseCase = new CreateAffiliateUseCase();
      affiliate = await createUseCase.execute({
        userId,
        email,
        name,
      });
    }

    const linkCode = affiliate.affiliateLink ?? null;

    const effectiveStatus =
      affiliate.paymentStatus === "unpaid" ? "pending" : affiliate.status;

    sendSuccess(res, {
      id: affiliate.id,
      status: effectiveStatus,
      paymentStatus: affiliate.paymentStatus ?? "unpaid",
      email: affiliate.email,
      name: affiliate.name,
      storeId: buildStoreUrl(affiliate.storeId),
      pixelId: affiliate.pixelId,
      affiliateLink: linkCode
        ? `${process.env.FRONTEND_URL || "http://localhost:5173"}/register?ref=${linkCode}`
        : null,
      affiliateLinkCode: linkCode,
      affiliateCommission: affiliate.affiliateCommission ?? 0,
      createdAt: affiliate.createdAt,
    });
  },
);

export const deleteAffiliate = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = validateAffiliateIdParam(req.params);

    const useCase = new DeleteAffiliateUseCase();
    await useCase.execute({ affiliateId: id });

    res.status(204).send();
  },
);

// ── Affiliate Products ────────────────────────────────────────────────────────

export const getAffiliateProducts = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = validateAffiliateIdParam(req.params);

    const useCase = new GetAffiliateProductsUseCase();
    const products = await useCase.execute({ affiliateId: id });

    sendSuccess(res, products);
  },
);

export const assignProduct = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = validateAffiliateIdParam(req.params);
    const dto = validateAssignProduct(req.body);

    const useCase = new AssignProductUseCase();
    const result = await useCase.execute({
      affiliateId: id,
      productId: dto.productId,
      commissionType: dto.commissionType,
      commissionValue: dto.commissionValue,
    });

    res.status(201).json({ success: true, data: result });
  },
);

export const removeProduct = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { id, productId } = validateAffiliateProductParam(req.params);

    const useCase = new RemoveProductUseCase();
    await useCase.execute({ affiliateId: id, productId });

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

    const affiliateLink =
      (req.body.referralCode as string | undefined) ||
      (req.query.affiliateLink as string | undefined) ||
      (req.body.affiliateLink as string | undefined) ||
      undefined;

    const useCase = new CreateAffiliatePaymentUseCase();
    const result = await useCase.execute({
      userId,
      email: userEmail,
      fullName: userFullName,
      affiliateLink,
    });
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

    const useCase = new VerifyAffiliatePaymentUseCase();
    const result = await useCase.execute({
      intentId: intentId as string,
      userId: userId as string,
      affiliateLink: affiliateLink as string | undefined,
    });

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
        const useCase = new VerifyAffiliatePaymentUseCase();
        await useCase.execute({
          intentId,
          userId,
          affiliateLink,
        });
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
    const useCase = new GetAffiliateSettingsUseCase();
    const settings = await useCase.execute();
    sendSuccess(res, settings);
  },
);

export const updateAffiliateSettings = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { registrationFee, referralCommissionRate, referralCommissionType } =
      req.body;

    const useCase = new UpdateAffiliateSettingsUseCase();
    const settings = await useCase.execute({
      registrationFee,
      referralCommissionRate,
      referralCommissionType,
    });
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

    const useCase = new GenerateAffiliateLinkUseCase();
    const result = await useCase.execute({ userId });

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

    const useCase = new SetAffiliateReferrerUseCase();
    await useCase.execute({ affiliateId, referrerId });
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

    const useCase = new RecordReferralCommissionUseCase();
    const result = await useCase.execute({
      referredAffiliateId: affiliateId,
      paymentAmount,
    });

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

    const useCase = new AddCommissionByReferralCodeUseCase();
    const result = await useCase.execute({ referralCode });

    sendSuccess(res, result, "Commission added successfully");
  },
);
