import { resolve } from "../../../di/container";
import { IAffiliateRepository } from "../../../domain/interfaces/IAffiliateRepository";
import { AppError } from "../../../common/utils/AppError";
import { ConversionValueType } from "./index";

export interface UpdateAffiliatePixelConfigInput {
  affiliateId: string;
  pixelId?: string;
  pixelAccessToken?: string;
  enablePurchaseEvent?: boolean;
  enableLeadEvent?: boolean;
  conversionValueType?: ConversionValueType;
  conversionValueFixed?: number;
}

export interface UpdateAffiliatePixelConfigOutput {
  affiliateId: string;
  pixelId: string;
  pixelAccessToken?: string;
  enablePurchaseEvent: boolean;
  enableLeadEvent: boolean;
  conversionValueType: ConversionValueType;
  conversionValueFixed?: number;
}

export const updateAffiliatePixelConfig = async (
  input: UpdateAffiliatePixelConfigInput,
): Promise<UpdateAffiliatePixelConfigOutput> => {
  // Resolve repository from DI container
  const affiliateRepository = resolve<IAffiliateRepository>(
    "IAffiliateRepository",
  );

  // Check if affiliate exists
  const affiliate = await affiliateRepository.findById(input.affiliateId);

  if (!affiliate) {
    throw new AppError("Affiliate not found", 404);
  }

  // Build update data
  const updateData: Partial<{
    pixel_id: string;
    pixel_access_token: string;
    enable_purchase_event: boolean;
    enable_lead_event: boolean;
    conversion_value_type: ConversionValueType;
    conversion_value_fixed: number;
  }> = {};

  if (input.pixelId !== undefined) updateData.pixel_id = input.pixelId;
  if (input.pixelAccessToken !== undefined)
    updateData.pixel_access_token = input.pixelAccessToken;
  if (input.enablePurchaseEvent !== undefined)
    updateData.enable_purchase_event = input.enablePurchaseEvent;
  if (input.enableLeadEvent !== undefined)
    updateData.enable_lead_event = input.enableLeadEvent;
  if (input.conversionValueType !== undefined)
    updateData.conversion_value_type = input.conversionValueType;
  if (input.conversionValueFixed !== undefined)
    updateData.conversion_value_fixed = input.conversionValueFixed;

  // Update affiliate using repository
  await affiliateRepository.update(input.affiliateId, updateData as any);

  // Return updated config
  return {
    affiliateId: input.affiliateId,
    pixelId: input.pixelId || affiliate.pixelId || "",
    pixelAccessToken:
      input.pixelAccessToken || affiliate.pixelAccessToken || undefined,
    enablePurchaseEvent:
      input.enablePurchaseEvent ?? affiliate.enablePurchaseEvent,
    enableLeadEvent: input.enableLeadEvent ?? affiliate.enableLeadEvent,
    conversionValueType:
      (input.conversionValueType as ConversionValueType) ||
      affiliate.conversionValueType ||
      "sale_amount",
    conversionValueFixed:
      input.conversionValueFixed ?? affiliate.conversionValueFixed ?? undefined,
  };
};
