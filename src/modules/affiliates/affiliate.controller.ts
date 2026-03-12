import { Request, Response } from "express";
import { catchAsync } from "../../common/utils/catchAsync";
import { sendSuccess } from "../../common/utils/response";
import * as affiliateService from "./affiliate.service";
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
    const affiliate = await affiliateService.activateAffiliate(id);
    sendSuccess(res, affiliate, "Affiliate activated");
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
