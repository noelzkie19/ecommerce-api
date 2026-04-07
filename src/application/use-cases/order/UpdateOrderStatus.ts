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
import { SendTemplateEmailUseCase } from "../email/SendTemplateEmail";

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
  trackingNumber?: string;
  cancellationReason?: string;
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
  private readonly sendTemplateEmailUseCase: SendTemplateEmailUseCase;

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
    this.sendTemplateEmailUseCase = new SendTemplateEmailUseCase();
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
    await this.orderRepository.updateStatus(
      input.orderId,
      input.status,
      input.trackingNumber,
    );

    // Send status update email (non-blocking)
    this.sendStatusUpdateEmail(
      currentOrder.email,
      currentOrder.fullName,
      input.orderId,
      input.status,
      input.trackingNumber,
      input.cancellationReason,
      currentOrder.shippingAddress,
    ).catch((err) =>
      console.error("Failed to send order status update email:", err),
    );

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

  /**
   * Send status update email based on the new status
   */
  private async sendStatusUpdateEmail(
    email: string,
    customerName: string,
    orderId: string,
    status: OrderStatus,
    trackingNumber?: string,
    cancellationReason?: string,
    shippingAddress?: string,
  ): Promise<void> {
    try {
      let templateKey: string;
      const variables: Record<string, string> = {
        customer_name: customerName,
        order_id: orderId.slice(0, 6),
        year: new Date().getFullYear().toString(),
      };

      switch (status) {
        case "processing":
          templateKey = "order_processing";
          break;

        case "shipped":
          templateKey = "order_shipped";
          variables.tracking_number = trackingNumber ?? "";
          variables.shipping_address = shippingAddress ?? "";
          break;

        case "delivered":
          templateKey = "order_delivered";
          break;

        case "cancelled":
          templateKey = "order_cancelled";
          variables.cancellation_reason = cancellationReason ?? "";
          break;

        default:
          return;
      }

      await this.sendTemplateEmailUseCase.execute({
        to: email,
        templateKey,
        variables,
      });
    } catch (error) {
      console.error("Error sending status update email:", error);
    }
  }
}
