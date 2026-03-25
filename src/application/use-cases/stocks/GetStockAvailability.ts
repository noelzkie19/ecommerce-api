/**
 * Get Stock Availability Use Case
 *
 * Checks if a product is in stock (public endpoint).
 */

import { IStockRepository } from "../../../domain/interfaces/IStockRepository";
import { resolve, TOKENS } from "../../../di/container";

/**
 * Input DTO for GetStockAvailabilityUseCase
 */
export interface GetStockAvailabilityInput {
  productId: string;
}

/**
 * Output DTO for GetStockAvailabilityUseCase
 */
export interface GetStockAvailabilityOutput {
  available: boolean;
  quantity: number;
}

/**
 * Get Stock Availability Use Case
 */
export class GetStockAvailabilityUseCase {
  private readonly stockRepository: IStockRepository;

  constructor(stockRepository?: IStockRepository) {
    this.stockRepository =
      stockRepository ?? resolve<IStockRepository>(TOKENS.IStockRepository);
  }

  /**
   * Execute the use case
   */
  async execute(
    input: GetStockAvailabilityInput,
  ): Promise<GetStockAvailabilityOutput> {
    const stock = await this.stockRepository.findByProductId(input.productId);
    const quantity = stock?.quantity ?? 0;
    return {
      available: quantity > 0,
      quantity,
    };
  }
}
