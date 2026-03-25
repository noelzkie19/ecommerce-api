/**
 * Update Order Status Use Case (Admin)
 *
 * Updates the status of an order (admin only).
 *
 * Enforces valid status transitions:
 *   pending    → confirmed | cancelled
 *   confirmed  → processing | cancelled
 *   processing → shipped | cancelled
 *   shipped    → delivered | cancelled
 *   delivered  → (terminal)
 *   cancelled  → (terminal)
 *
 * When a COD order is marked as "delivered":
 *  - Records affiliate sales for each order item (if products are assigned to affiliates)
 *  - Updates affiliate total_sales and total_commissions
 */

import { IOrderRepository } from "../../../domain/interfaces/IOrderRepository";
import { IAffiliateSalesRepository } from "../../../domain/interfaces/IAffiliateSalesRepository";
import { IAffiliateRepository } from "../../../domain/interfaces/IAffiliateRepository";
import { AppError } from "../../../common/utils/AppError";
import { resolve, TOKENS } from "../../../di/container";
import type { OrderStatus } from "../../../domain/entities/Order";

/**
 * Valid status transitions map
 */
const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered", "cancelled"],
  delivered: [],
  cancelled: [],
};

/**
 * Input DTO for UpdateOrderStatusUseCase
 */
export interface UpdateOrderStatusInput {
  orderId: string;
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
 * Update Order Status Use Case (Admin)
 */
export class UpdateOrderStatusUseCase {
  private readonly orderRepository: IOrderRepository;
  private readonly affiliateSalesRepository: IAffiliateSalesRepository;
  private readonly affiliateRepository: IAffiliateRepository;

  constructor(
    orderRepository?: IOrderRepository,
    affiliateSalesRepository?: IAffiliateSalesRepository,
    affiliateRepository?: IAffiliateRepository,
  ) {
    this.orderRepository =
      orderRepository ?? resolve<IOrderRepository>(TOKENS.IOrderRepository);
    this.affiliateSalesRepository =
      affiliateSalesRepository ??
      resolve<IAffiliateSalesRepository>(TOKENS.IAffiliateSalesRepository);
    this.affiliateRepository =
      affiliateRepository ??
      resolve<IAffiliateRepository>(TOKENS.IAffiliateRepository);
  }

  /**
   * Execute the use case
   */
  async execute(
    input: UpdateOrderStatusInput,
  ): Promise<UpdateOrderStatusOutput> {
    // Fetch current order to validate transition
    const currentOrder = await this.orderRepository.findById(input.orderId);
    if (!currentOrder) {
      throw new AppError("Order not found", 404);
    }

    const currentStatus = currentOrder.status;
    const allowedNext = VALID_TRANSITIONS[currentStatus] ?? [];

    if (!allowedNext.includes(input.status)) {
      throw new AppError(
        `Cannot transition order from "${currentStatus}" to "${input.status}". ` +
          (allowedNext.length > 0
            ? `Allowed next statuses: ${allowedNext.join(", ")}.`
            : `Order is in a terminal state and cannot be updated.`),
        400,
      );
    }

    // Update order status
    await this.orderRepository.updateStatus(input.orderId, input.status);

    // When a COD order is marked as "delivered", it is considered paid.
    // Record affiliate sales and update affiliate totals.
    // Errors here must NOT fail the order status update.
    if (input.status === "delivered") {
      try {
        await this.handleDeliveredOrder(input.orderId);
      } catch (err) {
        console.error(
          `Failed to record affiliate sales for order ${input.orderId}:`,
          err,
        );
      }
    }

    // Return the full order with items
    const fullOrder = await this.orderRepository.findOrderById(input.orderId);
    return fullOrder;
  }

  /**
   * Handle affiliate commission recording when an order is delivered.
   * This covers COD orders (payment on delivery) as well as any order
   * that reaches the "delivered" state.
   *
   * Errors are logged but do NOT fail the order status update.
   */
  private async handleDeliveredOrder(orderId: string): Promise<void> {
    // 1. Record affiliate_sales rows for each order item
    await this.affiliateSalesRepository.recordSalesForOrder(orderId);

    // 2. Get the aggregated totals per affiliate for this order
    const summaries =
      await this.affiliateSalesRepository.getSalesSummaryByOrder(orderId);

    // 3. Update each affiliate's running totals
    for (const summary of summaries) {
      try {
        await this.affiliateRepository.updateTotals(
          summary.affiliateId,
          summary.totalSaleAmount,
          summary.totalCommission,
        );
      } catch (err) {
        // Log but don't fail the order status update if a single affiliate update fails
        console.error(
          `Failed to update totals for affiliate ${summary.affiliateId}:`,
          err,
        );
      }
    }
  }
}
