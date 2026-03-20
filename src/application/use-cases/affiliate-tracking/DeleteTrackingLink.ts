import * as trackingRepository from "../../../modules/affiliate-tracking/affiliate-tracking.repository";

export interface DeleteTrackingLinkInput {
  id: string;
}

export const deleteTrackingLink = async (
  input: DeleteTrackingLinkInput,
): Promise<void> => {
  await trackingRepository.deleteTrackingLink(input.id);
};
