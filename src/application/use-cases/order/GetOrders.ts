/**
 * Get Orders Use Case
 *
 * Retrieves all orders for the current owner (user or guest).
 */

import { IOrderRepository } from "../../../domain/interfaces/IOrderRepository";
import { CartOwner } from "../../../domain/entities/CartItem";
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
  orders: Array<{
    id: string;
    userId: string | null;
    guestId: string | null;
    fullName: string;
    email: string;
    phoneNumber: string;
    shippingAddress: string;
    orderNotes: string | null;
    paymentMethod: "cod" | "gcash" | "card";
    paymentStatus: "pending" | "paid" | "failed" | "refunded";
    status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";
    subtotal: number;
    discount: number;
    total: number;
    paymentIntentId: string | null;
    affiliateId: string | null;
    trackingMethod: string | null;
    clickId: string | null;
    items: Array<{
      id: string;
      orderId: string;
      productId: string;
      quantity: number;
      unitPrice: number;
      total: number;
      product: {
        id: string;
        name: string;
        price: number;
        imageUrl: string | null;
        primaryImageUrl: string | null;
        images: Array<{ id: string; url: string; position: number }>;
      } | null;
    }>;
    createdAt: string;
    updatedAt: string;
  }>;
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
