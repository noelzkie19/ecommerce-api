/**
 * Delete Affiliate Sale Use Case
 *
 * Deletes an affiliate sale.
 */

import { IAffiliateSalesRepository } from "../../../domain/interfaces/IAffiliateSalesRepository";
import { resolve, TOKENS } from "../../../di/container";

/**
 * Input DTO for DeleteAffiliateSaleUseCase
 */
export interface DeleteAffiliateSaleInput {
  id: string;
}

/**
 * Delete Affiliate Sale Use Case
 *
 * Deletes an affiliate sale.
 */
export class DeleteAffiliateSaleUseCase {
  private readonly affiliateSalesRepository: IAffiliateSalesRepository;

  constructor(affiliateSalesRepository?: IAffiliateSalesRepository) {
    this.affiliateSalesRepository =
      affiliateSalesRepository ??
      resolve<IAffiliateSalesRepository>(TOKENS.IAffiliateSalesRepository);
  }

  /**
   * Execute the use case
   */
  async execute(input: DeleteAffiliateSaleInput): Promise<void> {
    const { id } = input;
    await this.affiliateSalesRepository.delete(id);
  }
}
