import { resolve } from "../../../di/container";
import { IAffiliateRepository } from "../../../domain/interfaces/IAffiliateRepository";
import { AppError } from "../../../common/utils/AppError";
import { ConversionValueType } from "./index";

export interface GetAffiliatePixelConfigInput {
  affiliateId: string;
}

export interface AffiliatePixelConfigOutput {
  affiliateId: string;
  pixelId: string;
  pixelAccessToken?: string;
  enablePurchaseEvent: boolean;
  enableLeadEvent: boolean;
  conversionValueType: ConversionValueType;
  conversionValueFixed?: number;
}

export const getAffiliatePixelConfig = async (
  input: GetAffiliatePixelConfigInput,
): Promise<AffiliatePixelConfigOutput> => {
  // Resolve repository from DI container
  const affiliateRepository = resolve<IAffiliateRepository>(
    "IAffiliateRepository",
  );

  const affiliate = await affiliateRepository.findById(input.affiliateId);

  if (!affiliate) {
    throw new AppError("Affiliate not found", 404);
  }

  return {
    affiliateId: affiliate.id,
    pixelId: affiliate.pixelId || "",
    pixelAccessToken: affiliate.pixelAccessToken || undefined,
    enablePurchaseEvent: affiliate.enablePurchaseEvent,
    enableLeadEvent: affiliate.enableLeadEvent,
    conversionValueType: affiliate.conversionValueType || "sale_amount",
    conversionValueFixed: affiliate.conversionValueFixed || undefined,
  };
};
