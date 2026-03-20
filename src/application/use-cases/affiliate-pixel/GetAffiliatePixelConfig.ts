import * as affiliateRepository from "../../../modules/affiliates/affiliate.repository";
import { ConversionValueType } from "../../../modules/affiliate-pixel/affiliate-pixel.types";

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
  const affiliate = await affiliateRepository.findById(input.affiliateId);

  return {
    affiliateId: affiliate.id,
    pixelId: affiliate.pixel_id || "",
    pixelAccessToken: affiliate.pixel_access_token,
    enablePurchaseEvent: affiliate.enable_purchase_event,
    enableLeadEvent: affiliate.enable_lead_event,
    conversionValueType:
      (affiliate.conversion_value_type as ConversionValueType) || "sale_amount",
    conversionValueFixed: affiliate.conversion_value_fixed,
  };
};
