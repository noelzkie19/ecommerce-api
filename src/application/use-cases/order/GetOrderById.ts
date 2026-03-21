/**
 * Get Order By ID Use Case
 *
 * Retrieves a single order by ID.
 * If owner is provided, validates that the caller owns the order.
 */

import { IOrderRepository } from "../../../domain/interfaces/IOrderRepository";
import { CartOwner } from "../../../domain/entities/CartItem";
import { OrderResponse } from "../../../domain/entities/Order";
import { resolve, TOKENS } from "../../../di/container";
import { AppError } from "../../../common/utils/AppError";

/**
 * Input DTO for GetOrderByIdUseCase
 */
export interface GetOrderByIdInput {
  id: string;
  /** If provided, verifies the order belongs to this owner */
  owner?: CartOwner;
}

/**
 * Output DTO for GetOrderByIdUseCase
 */
export type GetOrderByIdOutput = OrderResponse;

/**
 * Get Order By ID Use Case
 */
export class GetOrderByIdUseCase {
  private readonly orderRepository: IOrderRepository;

  constructor(orderRepository?: IOrderRepository) {
    this.orderRepository =
      orderRepository ??
      resolve<IOrderRepository>(TOKENS.IOrderRepository);
  }

  /**
   * Execute the use case
   */
  async execute(input: GetOrderByIdInput): Promise<GetOrderByIdOutput> {
    const order = await this.orderRepository.findById(input.id);
    if (!order) {
      throw new AppError("Order not found", 404);
    }

    if (input.owner) {
      const ownerMatches =
        (input.owner.userId && order.userId === input.owner.userId) ||
        (input.owner.guestId && order.guestId === input.owner.guestId);

      if (!ownerMatches) {
        throw new AppError("Forbidden", 403);
      }
    }

    return order.toResponse();
  }
}
