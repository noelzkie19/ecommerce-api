/**
 * Get Orders Use Case
 *
 * Retrieves all orders for the current owner (user or guest).
 */

import { IOrderRepository } from "../../../domain/interfaces/IOrderRepository";
import { CartOwner } from "../../../domain/entities/CartItem";
import { OrderResponse } from "../../../domain/entities/Order";
import { resolve, TOKENS } from "../../../di/container";

/**
 * Input DTO for GetOrdersUseCase
 */
export interface GetOrdersInput {
  owner: CartOwner;
}

/**
 * Output DTO for GetOrdersUseCase
 */
export interface GetOrdersOutput {
  orders: OrderResponse[];
}

/**
 * Get Orders Use Case
 */
export class GetOrdersUseCase {
  private readonly orderRepository: IOrderRepository;

  constructor(orderRepository?: IOrderRepository) {
    this.orderRepository =
      orderRepository ??
      resolve<IOrderRepository>(TOKENS.IOrderRepository);
  }

  /**
   * Execute the use case
   */
  async execute(input: GetOrdersInput): Promise<GetOrdersOutput> {
    const orders = await this.orderRepository.findByOwner(
      input.owner.userId ?? null,
      input.owner.guestId ?? null,
    );
    return { orders: orders.map((o) => o.toResponse()) };
  }
}
