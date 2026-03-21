/**
 * Get All Orders Admin Use Case
 *
 * Retrieves all orders with pagination and optional status filter.
 * Intended for admin use only.
 */

import { IOrderRepository } from "../../../domain/interfaces/IOrderRepository";
import { OrderResponse, OrderStatus } from "../../../domain/entities/Order";
import { resolve, TOKENS } from "../../../di/container";

/**
 * Input DTO for GetAllOrdersAdminUseCase
 */
export interface GetAllOrdersAdminInput {
  page?: number;
  limit?: number;
  status?: OrderStatus;
}

/**
 * Output DTO for GetAllOrdersAdminUseCase
 */
export interface GetAllOrdersAdminOutput {
  orders: OrderResponse[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * Get All Orders Admin Use Case
 */
export class GetAllOrdersAdminUseCase {
  private readonly orderRepository: IOrderRepository;

  constructor(orderRepository?: IOrderRepository) {
    this.orderRepository =
      orderRepository ??
      resolve<IOrderRepository>(TOKENS.IOrderRepository);
  }

  /**
   * Execute the use case
   */
  async execute(
    input: GetAllOrdersAdminInput,
  ): Promise<GetAllOrdersAdminOutput> {
    const page = input.page ?? 1;
    const limit = input.limit ?? 10;

    const result = await this.orderRepository.findAllPaginated(
      page,
      limit,
      input.status,
    );

    return {
      orders: result.data.map((o) => o.toResponse()),
      meta: result.meta,
    };
  }
}
