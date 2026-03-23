/**
 * Get All Orders Admin Use Case
 *
 * Retrieves all orders with pagination and optional status filter.
 * Intended for admin use only.
 */

import { IOrderRepository } from "../../../domain/interfaces/IOrderRepository";
import { OrderStatus } from "../../../domain/entities/Order";
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
