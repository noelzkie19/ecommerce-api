import { z } from "zod";
import { AppError } from "../utils/AppError";

// ── Schemas ───────────────────────────────────────────────────────────────────

export const createAffiliateSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const updateAffiliateSchema = z.object({
  name: z.string().min(1, "name cannot be empty").optional(),
  email: z.string().email("Invalid email address").optional(),
  status: z
    .enum(["pending", "active", "suspended", "rejected"], {
      errorMap: () => ({
        message: "status must be pending, active, suspended, or rejected",
      }),
    })
    .optional(),
});

export const assignProductSchema = z.object({
  productId: z.string().uuid("productId must be a valid UUID"),
  commissionType: z.enum(["percentage", "fixed"], {
    errorMap: () => ({
      message: "commissionType must be 'percentage' or 'fixed'",
    }),
  }),
  commissionValue: z
    .number({ invalid_type_error: "commissionValue must be a number" })
    .positive("commissionValue must be greater than 0"),
});

export const affiliateIdParamSchema = z.object({
  id: z.string().uuid("Affiliate ID must be a valid UUID"),
});

export const affiliateProductParamSchema = z.object({
  id: z.string().uuid("Affiliate ID must be a valid UUID"),
  productId: z.string().uuid("Product ID must be a valid UUID"),
});

export const affiliatePaginatedQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? Number.parseInt(val, 10) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? Number.parseInt(val, 10) : 20)),
  search: z.string().optional(),
  status: z
    .enum(["pending", "active", "suspended", "rejected"], {
      errorMap: () => ({
        message: "status must be pending, active, suspended, or rejected",
      }),
    })
    .optional(),
});

export const approveAffiliateSchema = z.object({
  paymentProofUrl: z.string().url("Invalid URL format").optional(),
  paymentProofRef: z.string().optional(),
});

export const addPaymentProofByAdminSchema = z.object({
  paymentProofUrl: z.string().url("Invalid URL format"),
  paymentProofRef: z.string().optional(),
});

export const submitPaymentProofSchema = z.object({
  proofUrl: z.string().url("Invalid URL format"),
  proofRef: z.string().optional(),
});

// ── Inferred types ────────────────────────────────────────────────────────────

export type CreateAffiliateInput = z.infer<typeof createAffiliateSchema>;
export type UpdateAffiliateInput = z.infer<typeof updateAffiliateSchema>;
export type AssignProductInput = z.infer<typeof assignProductSchema>;
export type AffiliateIdParam = z.infer<typeof affiliateIdParamSchema>;
export type AffiliateProductParam = z.infer<typeof affiliateProductParamSchema>;
export type AffiliatePaginatedQuery = z.infer<
  typeof affiliatePaginatedQuerySchema
>;
export type ApproveAffiliateInput = z.infer<typeof approveAffiliateSchema>;
export type AddPaymentProofByAdminInput = z.infer<
  typeof addPaymentProofByAdminSchema
>;
export type SubmitPaymentProofInput = z.infer<typeof submitPaymentProofSchema>;

// ── Helper ────────────────────────────────────────────────────────────────────

const handleZodError = (error: z.ZodError): never => {
  const firstError = error.errors[0];
  const message = firstError
    ? `${firstError.path.join(".")}: ${firstError.message}`
    : "Validation failed";
  throw new AppError(message, 400);
};

// ── Validators ────────────────────────────────────────────────────────────────

export const validateCreateAffiliate = (
  data: unknown,
): CreateAffiliateInput => {
  try {
    return createAffiliateSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) handleZodError(error);
    throw error;
  }
};

export const validateUpdateAffiliate = (
  data: unknown,
): UpdateAffiliateInput => {
  try {
    return updateAffiliateSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) handleZodError(error);
    throw error;
  }
};

export const validateApproveAffiliate = (
  data: unknown,
): ApproveAffiliateInput => {
  try {
    return approveAffiliateSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) handleZodError(error);
    throw error;
  }
};

export const validateAddPaymentProofByAdmin = (
  data: unknown,
): AddPaymentProofByAdminInput => {
  try {
    return addPaymentProofByAdminSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) handleZodError(error);
    throw error;
  }
};

export const validateSubmitPaymentProof = (
  data: unknown,
): SubmitPaymentProofInput => {
  try {
    return submitPaymentProofSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) handleZodError(error);
    throw error;
  }
};

export const validateAssignProduct = (data: unknown): AssignProductInput => {
  try {
    return assignProductSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) handleZodError(error);
    throw error;
  }
};

export const validateAffiliateIdParam = (data: unknown): AffiliateIdParam => {
  try {
    return affiliateIdParamSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) handleZodError(error);
    throw error;
  }
};

export const validateAffiliateProductParam = (
  data: unknown,
): AffiliateProductParam => {
  try {
    return affiliateProductParamSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) handleZodError(error);
    throw error;
  }
};

export const validateAffiliatePaginatedQuery = (
  data: unknown,
): AffiliatePaginatedQuery => {
  try {
    return affiliatePaginatedQuerySchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) handleZodError(error);
    throw error;
  }
};
