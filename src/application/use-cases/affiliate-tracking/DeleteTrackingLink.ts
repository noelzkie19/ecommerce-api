import { resolve } from "../../../di/container";
import { IAffiliateTrackingRepository } from "../../../domain/interfaces/IAffiliateTrackingRepository";

export interface DeleteTrackingLinkInput {
  id: string;
}

export const deleteTrackingLink = async (
  input: DeleteTrackingLinkInput,
): Promise<void> => {
  const trackingRepo = resolve<IAffiliateTrackingRepository>(
    "IAffiliateTrackingRepository",
  );
  await trackingRepo.deleteTrackingLink(input.id);
};
