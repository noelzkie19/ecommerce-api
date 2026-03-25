/**
 * Get Order Use Case
 *
 * Retrieves a single order by ID for the owner.
 */

import { IOrderRepository } from "../../../domain/interfaces/IOrderRepository";
import { resolve, TOKENS } from "../../../di/container";

/**
 * Input DTO for GetOrderUseCase
 */
export interface GetOrderInput {
  orderId: string;
  userId?: string;
  guestId?: string;
}

/**
 * Output DTO for GetOrderUseCase
 */
export interface GetOrderOutput {
  id: string;
  userId: string | null;
  guestId: string | null;
  fullName: string;
  email: string;
  phoneNumber: string;
  shippingAddress: string;
  orderNotes: string | null;
  paymentMethod: string;
  paymentStatus: string;
  status: string;
  subtotal: number;
  discount: number;
  total: number;
  paymentIntentId: string | null;
  affiliateId: string | null;
  trackingMethod: string | null;
  clickId: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  items: any[];
}

/**
 * Get Order Use Case
 */
export class GetOrderUseCase {
  private readonly orderRepository: IOrderRepository;

  constructor(orderRepository?: IOrderRepository) {
    this.orderRepository =
      orderRepository ?? resolve<IOrderRepository>(TOKENS.IOrderRepository);
  }

  /**
   * Execute the use case
   */
  async execute(input: GetOrderInput): Promise<GetOrderOutput> {
    const order = await this.orderRepository.findOrderById(input.orderId);

    if (!order) {
      throw new Error("Order not found");
    }

    // Verify ownership
    const ownerMatches =
      (input.userId && order.user_id === input.userId) ||
      (input.guestId && order.guest_id === input.guestId);

    if (!ownerMatches) {
      throw new Error("Forbidden");
    }

    return order;
  }
}
