import * as trackingRepository from "../../../modules/affiliate-tracking/affiliate-tracking.repository";
import * as affiliateRepository from "../../../modules/affiliates/affiliate.repository";

export interface GetTrackingStatsInput {
  affiliateId: string;
  startDate?: string;
  endDate?: string;
}

export interface TrackingStatsOutput {
  affiliateId: string;
  totalClicks: number;
  totalConversions: number;
  conversionRate: number;
  totalSales: number;
  totalCommissions: number;
  recentClicks: {
    date: string;
    count: number;
  }[];
  recentConversions: {
    date: string;
    count: number;
  }[];
}

export const getTrackingStats = async (
  input: GetTrackingStatsInput,
): Promise<TrackingStatsOutput> => {
  // Validate affiliate exists
  await affiliateRepository.findById(input.affiliateId);

  return trackingRepository.getTrackingStats(
    input.affiliateId,
    input.startDate,
    input.endDate,
  );
};
