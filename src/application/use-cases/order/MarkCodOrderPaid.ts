/**
 * Mark COD Order Paid Use Case (Admin)
 *
 * Allows admin to manually mark a COD order's payment status as "paid".
 * Only applicable to COD orders. Non-COD orders use payment gateway webhooks.
 */

import { IOrderRepository } from "../../../domain/interfaces/IOrderRepository";
import { AppError } from "../../../common/utils/AppError";
import { resolve, TOKENS } from "../../../di/container";

/**
 * Input DTO for MarkCodOrderPaidUseCase
 */
export interface MarkCodOrderPaidInput {
  orderId: string;
}

/**
 * Output DTO for MarkCodOrderPaidUseCase
 */
export interface MarkCodOrderPaidOutput {
  id: string;
  paymentMethod: string;
  paymentStatus: string;
  status: string;
}

/**
 * Mark COD Order Paid Use Case (Admin)
 */
export class MarkCodOrderPaidUseCase {
  private readonly orderRepository: IOrderRepository;

  constructor(orderRepository?: IOrderRepository) {
    this.orderRepository =
      orderRepository ?? resolve<IOrderRepository>(TOKENS.IOrderRepository);
  }

  /**
   * Execute the use case
   */
  async execute(input: MarkCodOrderPaidInput): Promise<MarkCodOrderPaidOutput> {
    // Fetch the order to validate it exists and is a COD order
    const order = await this.orderRepository.findById(input.orderId);

    if (!order) {
      throw new AppError("Order not found", 404);
    }

    if (order.paymentMethod !== "cod") {
      throw new AppError(
        "Payment status can only be manually updated for COD orders",
        400,
      );
    }

    if (order.paymentStatus === "paid") {
      throw new AppError("Order is already marked as paid", 400);
    }

    // Update payment status to paid
    await this.orderRepository.updatePaymentStatusById(input.orderId, "paid");

    // Return updated order info
    const updated = await this.orderRepository.findById(input.orderId);

    if (!updated) {
      throw new AppError("Order not found after update", 500);
    }

    return {
      id: updated.id,
      paymentMethod: updated.paymentMethod,
      paymentStatus: updated.paymentStatus,
      status: updated.status,
    };
  }
}
