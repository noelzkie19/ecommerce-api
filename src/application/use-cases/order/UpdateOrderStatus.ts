/**
 * Update Order Status Use Case
 *
 * Updates the status of an order.
 * Restores stock if cancelled.
 * Records affiliate commissions if delivered.
 */

import { IOrderRepository } from "../../../domain/interfaces/IOrderRepository";
import { OrderStatus } from "../../../domain/entities/Order";
import { resolve, TOKENS } from "../../../di/container";
import { AppError } from "../../../common/utils/AppError";
import * as affiliateSalesService from "../../../modules/affiliates-sales/affiliate-sales.repository";
import { firePurchaseEvent } from "../affiliate-pixel";

/**
 * Input DTO for UpdateOrderStatusUseCase
 */
export interface UpdateOrderStatusInput {
  id: string;
  status: OrderStatus;
}

/**
 * Output DTO for UpdateOrderStatusUseCase
 */
export interface UpdateOrderStatusOutput {
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
 * Update Order Status Use Case
 */
export class UpdateOrderStatusUseCase {
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
    input: UpdateOrderStatusInput,
  ): Promise<UpdateOrderStatusOutput> {
    const existing = await this.orderRepository.findById(input.id);
    if (!existing) {
      throw new AppError("Order not found", 404);
    }

    if (input.status === "cancelled") {
      await this.orderRepository.restoreStock(input.id);
    }

    const updated = await this.orderRepository.updateStatus(
      input.id,
      input.status,
    );

    if (input.status === "delivered") {
      await affiliateSalesService.recordSalesForOrder(input.id);

      if (updated.hasAffiliateAttribution()) {
        try {
          await firePurchaseEvent({
            orderId: input.id,
            affiliateId: updated.affiliateId!,
          });
        } catch {
          // Non-critical — pixel firing should not block order status update
        }
      }
    }

    return updated.toResponse();
  }
}
