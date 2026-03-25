/**
 * List Orders Use Case
 *
 * Retrieves orders for a specific owner (user or guest).
 */

import { IOrderRepository } from "../../../domain/interfaces/IOrderRepository";
import { resolve, TOKENS } from "../../../di/container";

/**
 * Input DTO for ListOrdersUseCase
 */
export interface ListOrdersInput {
  userId?: string;
  guestId?: string;
}

/**
 * Output DTO for ListOrdersUseCase
 */
export interface ListOrdersOutput {
  orders: any[];
}

/**
 * List Orders Use Case
 */
export class ListOrdersUseCase {
  private readonly orderRepository: IOrderRepository;

  constructor(orderRepository?: IOrderRepository) {
    this.orderRepository =
      orderRepository ?? resolve<IOrderRepository>(TOKENS.IOrderRepository);
  }

  /**
   * Execute the use case
   */
  async execute(input: ListOrdersInput): Promise<ListOrdersOutput> {
    const orders = await this.orderRepository.findOrdersByOwner({
      userId: input.userId,
      guestId: input.guestId,
    });

    return { orders };
  }
}
