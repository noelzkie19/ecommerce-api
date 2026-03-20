/**
 * Affiliate Use Cases Index
 */

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

// Payments
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
