import { resolve } from "../../../di/container";
import { IAffiliateRepository } from "../../../domain/interfaces/IAffiliateRepository";

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
  const affiliateRepo = resolve<IAffiliateRepository>("IAffiliateRepository");
  const affiliate = await affiliateRepo.findByStoreId(input.storeId);

  if (!affiliate) {
    return null;
  }

  return {
    affiliateId: affiliate.id,
    pixelId: affiliate.pixelId,
    storeId: affiliate.storeId || "",
    affiliateName: affiliate.name,
  };
};
