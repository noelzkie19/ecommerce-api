/**
 * Get Order By ID Use Case
 *
 * Retrieves a single order by ID.
 * If owner is provided, validates that the caller owns the order.
 */

import { IOrderRepository } from "../../../domain/interfaces/IOrderRepository";
import { CartOwner } from "../../../domain/entities/CartItem";
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
export interface GetOrderByIdOutput {
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
}

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
