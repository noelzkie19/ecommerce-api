/**
 * Affiliate Use Cases Index
 */

// Shared Types
export type AffiliateStatus = "pending" | "active" | "suspended";
export type CommissionType = "percentage" | "fixed";
export type PaymentStatus = "unpaid" | "paid";

// DTOs for Repository Layer
export interface CreateAffiliateDTO {
  email: string;
  pixelId?: string;
  storeId?: string;
  status?: AffiliateStatus;
}

export interface UpdateAffiliateDTO {
  name?: string;
  email?: string;
  status?: AffiliateStatus;
  paymentStatus?: PaymentStatus;
  pixelId?: string;
  storeId?: string;
}

export interface AssignProductDTO {
  productId: string;
  commissionType: CommissionType;
  commissionValue: number;
}

// Pagination
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedAffiliates<T = any> {
  data: T[];
  meta: PaginationMeta;
}

// Affiliate Settings
export interface AffiliateSettings {
  registrationFee: number;
  referralCommissionRate: number;
  referralCommissionType: "percentage" | "fixed";
}

export interface UpdateSettingsDTO {
  registrationFee?: number;
  referralCommissionRate?: number;
  referralCommissionType?: "percentage" | "fixed";
}

// List & Get
export {
  ListAffiliatesUseCase,
  type ListAffiliatesInput,
  type ListAffiliatesOutput,
} from "./ListAffiliates";

export {
  GetAffiliateUseCase,
  type GetAffiliateInput,
  type GetAffiliateOutput,
} from "./GetAffiliate";

export {
  GetAffiliateByUserIdUseCase,
  type GetAffiliateByUserIdInput,
  type GetAffiliateByUserIdOutput,
} from "./GetAffiliateByUserId";

// Create, Update, Delete
export {
  CreateAffiliateUseCase,
  type CreateAffiliateInput,
  type CreateAffiliateOutput,
} from "./CreateAffiliate";

export {
  UpdateAffiliateUseCase,
  type UpdateAffiliateInput,
  type UpdateAffiliateOutput,
} from "./UpdateAffiliate";

export {
  DeleteAffiliateUseCase,
  type DeleteAffiliateInput,
} from "./DeleteAffiliate";

// Status changes
export {
  ActivateAffiliateUseCase,
  type ActivateAffiliateInput,
  type ActivateAffiliateOutput,
} from "./ActivateAffiliate";

export {
  SuspendAffiliateUseCase,
  type SuspendAffiliateInput,
  type SuspendAffiliateOutput,
} from "./SuspendAffiliate";

// Products
export {
  GetAffiliateProductsUseCase,
  type GetAffiliateProductsInput,
  type GetAffiliateProductsOutput,
} from "./GetAffiliateProducts";

export {
  AssignProductUseCase,
  type AssignProductInput,
  type AssignProductOutput,
} from "./AssignProduct";

export { RemoveProductUseCase, type RemoveProductInput } from "./RemoveProduct";

// Totals
export {
  UpdateAffiliateTotalsUseCase,
  type UpdateAffiliateTotalsInput,
} from "./UpdateAffiliateTotals";

// Link
export {
  GenerateAffiliateLinkUseCase,
  type GenerateAffiliateLinkInput,
  type GenerateAffiliateLinkOutput,
} from "./GenerateAffiliateLink";

// Pixel
export {
  UpdateMyPixelIdUseCase,
  type UpdateMyPixelIdInput,
  type UpdateMyPixelIdOutput,
} from "./UpdateMyPixelId";

// Payments (DEPRECATED - manual approval now)
export {
  CreateAffiliatePaymentUseCase,
  type CreateAffiliatePaymentInput,
  type CreateAffiliatePaymentOutput,
} from "./CreateAffiliatePayment";
export {
  VerifyAffiliatePaymentUseCase,
  type VerifyAffiliatePaymentInput,
  type VerifyAffiliatePaymentOutput,
} from "./VerifyAffiliatePayment";

// Manual Approval Workflow
export {
  SubmitPaymentProofUseCase,
  type SubmitPaymentProofInput,
  type SubmitPaymentProofOutput,
} from "./SubmitPaymentProof";
export {
  ApproveAffiliateUseCase,
  type ApproveAffiliateInput,
  type ApproveAffiliateOutput,
} from "./ApproveAffiliate";
export {
  RejectAffiliateUseCase,
  type RejectAffiliateInput,
  type RejectAffiliateOutput,
} from "./RejectAffiliate";
export {
  UploadPaymentProofImageUseCase,
  type UploadPaymentProofImageInput,
  type UploadPaymentProofImageOutput,
} from "./UploadPaymentProofImage";
export {
  AddPaymentProofByAdminUseCase,
  type AddPaymentProofByAdminInput,
  type AddPaymentProofByAdminOutput,
} from "./AddPaymentProofByAdmin";

// Settings
export {
  GetAffiliateSettingsUseCase,
  type GetAffiliateSettingsOutput,
} from "./GetAffiliateSettings";
export {
  UpdateAffiliateSettingsUseCase,
  type UpdateAffiliateSettingsInput,
  type UpdateAffiliateSettingsOutput,
} from "./UpdateAffiliateSettings";

// Referral
export {
  SetAffiliateReferrerUseCase,
  type SetAffiliateReferrerInput,
} from "./SetAffiliateReferrer";
export {
  RecordReferralCommissionUseCase,
  type RecordReferralCommissionInput,
  type RecordReferralCommissionOutput,
} from "./RecordReferralCommission";
export {
  AddCommissionByReferralCodeUseCase,
  type AddCommissionByReferralCodeInput,
  type AddCommissionByReferralCodeOutput,
} from "./AddCommissionByReferralCode";
