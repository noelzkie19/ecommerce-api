import { resolve } from "../../../di/container";
import { IAffiliateRepository } from "../../../domain/interfaces/IAffiliateRepository";
import { IAffiliateTrackingRepository } from "../../../domain/interfaces/IAffiliateTrackingRepository";

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
  // Resolve repositories from DI container
  const affiliateRepo = resolve<IAffiliateRepository>("IAffiliateRepository");
  const trackingRepo = resolve<IAffiliateTrackingRepository>(
    "IAffiliateTrackingRepository",
  );

  // Validate affiliate exists
  const affiliate = await affiliateRepo.findById(input.affiliateId);

  if (!affiliate) {
    // Return empty stats if affiliate not found
    return {
      affiliateId: input.affiliateId,
      totalClicks: 0,
      totalConversions: 0,
      conversionRate: 0,
      totalSales: 0,
      totalCommissions: 0,
      recentClicks: [],
      recentConversions: [],
    };
  }

  const stats = await trackingRepo.getTrackingStats(
    input.affiliateId,
    input.startDate,
    input.endDate,
  );

  return {
    affiliateId: stats.affiliateId,
    totalClicks: stats.totalClicks,
    totalConversions: stats.totalConversions,
    conversionRate: stats.conversionRate,
    totalSales: stats.totalSales,
    totalCommissions: stats.totalCommissions,
    recentClicks: stats.recentClicks,
    recentConversions: stats.recentConversions,
  };
};
