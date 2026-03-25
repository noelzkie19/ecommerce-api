/**
 * Get All Orders Use Case (Admin)
 *
 * Retrieves all orders with pagination for admin users.
 */

import { IOrderRepository } from "../../../domain/interfaces/IOrderRepository";
import { resolve, TOKENS } from "../../../di/container";
import type { OrderStatus } from "../../../domain/entities/Order";

/**
 * Input DTO for GetAllOrdersUseCase
 */
export interface GetAllOrdersInput {
  page: number;
  limit: number;
  status?: OrderStatus;
}

/**
 * Output DTO for GetAllOrdersUseCase
 */
export interface GetAllOrdersOutput {
  data: any[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * Get All Orders Use Case (Admin)
 */
export class GetAllOrdersUseCase {
  private readonly orderRepository: IOrderRepository;

  constructor(orderRepository?: IOrderRepository) {
    this.orderRepository =
      orderRepository ?? resolve<IOrderRepository>(TOKENS.IOrderRepository);
  }

  /**
   * Execute the use case
   */
  async execute(input: GetAllOrdersInput): Promise<GetAllOrdersOutput> {
    const result = await this.orderRepository.findAllOrders(
      input.page,
      input.limit,
      input.status,
    );

    return result;
  }
}
