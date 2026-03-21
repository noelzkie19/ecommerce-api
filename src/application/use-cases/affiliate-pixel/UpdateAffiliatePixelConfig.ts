import { supabaseAdmin } from "../../../config/supabase";
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
  const updates: Record<string, any> = {};

  if (input.pixelId !== undefined) updates.pixel_id = input.pixelId;
  if (input.pixelAccessToken !== undefined)
    updates.pixel_access_token = input.pixelAccessToken;
  if (input.enablePurchaseEvent !== undefined)
    updates.enable_purchase_event = input.enablePurchaseEvent;
  if (input.enableLeadEvent !== undefined)
    updates.enable_lead_event = input.enableLeadEvent;
  if (input.conversionValueType !== undefined)
    updates.conversion_value_type = input.conversionValueType;
  if (input.conversionValueFixed !== undefined)
    updates.conversion_value_fixed = input.conversionValueFixed;

  const { error } = await supabaseAdmin
    .from("affiliates")
    .update(updates)
    .eq("id", input.affiliateId);

  if (error) throw new AppError(error.message, 500);

  // Return updated config
  return {
    affiliateId: input.affiliateId,
    pixelId: input.pixelId || "",
    pixelAccessToken: input.pixelAccessToken,
    enablePurchaseEvent: input.enablePurchaseEvent ?? false,
    enableLeadEvent: input.enableLeadEvent ?? false,
    conversionValueType:
      (input.conversionValueType as ConversionValueType) || "sale-amount",
    conversionValueFixed: input.conversionValueFixed,
  };
};
