/**
 * Approve Affiliate Sale Use Case
 *
 * Approves an affiliate sale and updates affiliate totals.
 */

import { IAffiliateSalesRepository } from "../../../domain/interfaces/IAffiliateSalesRepository";
import { resolve, TOKENS } from "../../../di/container";
import { UpdateAffiliateTotalsUseCase } from "../affiliate/index";

/**
 * Input DTO for ApproveAffiliateSaleUseCase
 */
export interface ApproveAffiliateSaleInput {
  id: string;
}

/**
 * Output DTO for ApproveAffiliateSaleUseCase
 */
export interface ApproveAffiliateSaleOutput {
  id: string;
  affiliateId: string;
  orderId: string;
  orderItemId: string;
  productId: string;
  quantity: number;
  saleAmount: number;
  commissionType: string;
  commissionValue: number;
  commissionEarned: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  affiliate?: { id: string; name: string; email: string };
  product?: {
    id: string;
    name: string;
    price: number;
    image_url: string | null;
  };
  order?: { id: string; status: string; created_at: string };
}

/**
 * Approve Affiliate Sale Use Case
 *
 * Approves an affiliate sale and updates affiliate totals.
 */
export class ApproveAffiliateSaleUseCase {
  private readonly affiliateSalesRepository: IAffiliateSalesRepository;

  constructor(affiliateSalesRepository?: IAffiliateSalesRepository) {
    this.affiliateSalesRepository =
      affiliateSalesRepository ??
      resolve<IAffiliateSalesRepository>(TOKENS.IAffiliateSalesRepository);
  }

  /**
   * Execute the use case
   */
  async execute(
    input: ApproveAffiliateSaleInput,
  ): Promise<ApproveAffiliateSaleOutput> {
    const { id } = input;

    // Get the sale first to get the affiliateId and amounts
    const sale = await this.affiliateSalesRepository.findById(id);

    if (!sale) {
      throw new Error("Affiliate sale not found");
    }

    // Update status to approved
    const updated = await this.affiliateSalesRepository.updateStatus(
      id,
      "approved",
    );

    // Update affiliate's total sales and commissions
    const updateTotalsUseCase = new UpdateAffiliateTotalsUseCase();
    await updateTotalsUseCase.execute({
      affiliateId: sale.affiliateId,
      saleAmount: sale.saleAmount,
      commissionEarned: sale.commissionEarned,
    });

    return updated;
  }
}
