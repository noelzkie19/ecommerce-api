import * as salesRepository from "./affiliate-sales.repository";
import { AffiliateSaleStatus } from "./affiliate-sales.types";
import { AppError } from "../../common/utils/AppError";
import * as affiliateService from "../affiliates/affiliate.service";

export const recordSalesForOrder = (orderId: string) =>
  salesRepository.recordSalesForOrder(orderId);

export const getSales = (
  page: number,
  limit: number,
  affiliateId?: string,
  status?: AffiliateSaleStatus,
  search?: string,
) => salesRepository.findAllPaginated(page, limit, affiliateId, status, search);

export const getSale = (id: string) => salesRepository.findById(id);

export const approveSale = async (id: string) => {
  // Get the sale first to get the affiliateId and amounts
  const sale = await salesRepository.findById(id);

  // Update status to approved
  const updated = await salesRepository.updateStatus(id, "approved");

  // Update affiliate's total sales and commissions
  await affiliateService.updateAffiliateTotals(
    sale.affiliateId,
    sale.saleAmount,
    sale.commissionEarned,
  );

  return updated;
};

export const rejectSale = (id: string) =>
  salesRepository.updateStatus(id, "rejected");

export const updateSaleStatus = async (
  id: string,
  status: AffiliateSaleStatus,
) => {
  const VALID = new Set<AffiliateSaleStatus>([
    "pending",
    "approved",
    "rejected",
  ]);
  if (!VALID.has(status)) throw new AppError("Invalid status", 400);

  // Get the sale before updating to have access to old values
  const sale = await salesRepository.findById(id);

  // Update the status
  const updated = await salesRepository.updateStatus(id, status);

  // If approving, update affiliate totals
  if (status === "approved") {
    await affiliateService.updateAffiliateTotals(
      sale.affiliateId,
      sale.saleAmount,
      sale.commissionEarned,
    );
  }

  return updated;
};

export const deleteSale = (id: string) => salesRepository.remove(id);
