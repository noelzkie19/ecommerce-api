import * as affiliateRepository from "../../../modules/affiliates/affiliate.repository";

export interface ResolveRefInput {
  storeId: string;
}

export interface ResolveRefOutput {
  affiliateId: string;
  pixelId: string | null;
  storeId: string;
  affiliateName: string;
}

export const resolveRef = async (
  input: ResolveRefInput,
): Promise<ResolveRefOutput | null> => {
  const affiliate = await affiliateRepository.findByStoreId(input.storeId);

  if (!affiliate) {
    return null;
  }

  return {
    affiliateId: affiliate.id,
    pixelId: affiliate.pixel_id ?? null,
    storeId: affiliate.store_id,
    affiliateName: affiliate.name,
  };
};
