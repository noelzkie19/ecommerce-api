/**
 * Get Order Admin Use Case
 *
 * Retrieves a single order by ID for admin (no ownership check).
 */

import { IOrderRepository } from "../../../domain/interfaces/IOrderRepository";
import { resolve, TOKENS } from "../../../di/container";

/**
 * Input DTO for GetOrderAdminUseCase
 */
export interface GetOrderAdminInput {
  orderId: string;
}

/**
 * Output DTO for GetOrderAdminUseCase
 */
export interface GetOrderAdminOutput {
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
 * Get Order Admin Use Case
 */
export class GetOrderAdminUseCase {
  private readonly orderRepository: IOrderRepository;

  constructor(orderRepository?: IOrderRepository) {
    this.orderRepository =
      orderRepository ?? resolve<IOrderRepository>(TOKENS.IOrderRepository);
  }

  /**
   * Execute the use case
   */
  async execute(input: GetOrderAdminInput): Promise<GetOrderAdminOutput> {
    const order = await this.orderRepository.findOrderById(input.orderId);

    if (!order) {
      throw new Error("Order not found");
    }

    return order;
  }
}
