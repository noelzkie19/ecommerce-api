/**
 * Verify GCash Payment Use Case
 *
 * Verifies the payment status for a GCash transaction.
 * Called by the frontend after the user returns from the GCash app.
 */

import { IOrderRepository } from "../../../domain/interfaces/IOrderRepository";
import { resolve, TOKENS } from "../../../di/container";
import * as paymongoUtils from "../../../utils/paymongo.utils";

/**
 * Input DTO for VerifyGCashPaymentUseCase
 */
export interface VerifyGCashPaymentInput {
  intentId: string;
}

/**
 * Output DTO for VerifyGCashPaymentUseCase
 */
export interface VerifyGCashPaymentOutput {
  status: "pending" | "succeeded" | "failed";
  orderId: string | null;
  alreadyConfirmed: boolean;
}

/**
 * Verify GCash Payment Use Case
 */
export class VerifyGCashPaymentUseCase {
  private readonly orderRepository: IOrderRepository;

  constructor(orderRepository?: IOrderRepository) {
    this.orderRepository =
      orderRepository ?? resolve<IOrderRepository>(TOKENS.IOrderRepository);
  }

  /**
   * Execute the use case
   */
  async execute(
    input: VerifyGCashPaymentInput,
  ): Promise<VerifyGCashPaymentOutput> {
    // 1. Get the payment intent status from PayMongo
    const paymentStatus = await paymongoUtils.getPaymentIntentStatus(
      input.intentId,
    );

    // 2. Find the order by payment intent ID
    const order = await this.orderRepository.findByIntentId(input.intentId);

    if (!order) {
      // Order not found - could be invalid intent or already processed
      return {
        status: paymentStatus === "succeeded" ? "succeeded" : "pending",
        orderId: null,
        alreadyConfirmed: false,
      };
    }

    // 3. Check if already confirmed (idempotent)
    if (order.paymentStatus === "paid") {
      return {
        status: "succeeded",
        orderId: order.id,
        alreadyConfirmed: true,
      };
    }

    // 4. Handle based on payment status
    if (paymentStatus === "succeeded") {
      // Payment successful - update order status
      await this.orderRepository.updatePaymentStatus(input.intentId, "paid");
      await this.orderRepository.updateStatus(order.id, "confirmed");

      return {
        status: "succeeded",
        orderId: order.id,
        alreadyConfirmed: false,
      };
    } else if (paymentStatus === "payment_intent.payment_failed") {
      // Payment failed - update order status
      await this.orderRepository.updatePaymentStatus(input.intentId, "failed");
      await this.orderRepository.updateStatus(order.id, "cancelled");

      return {
        status: "failed",
        orderId: order.id,
        alreadyConfirmed: false,
      };
    } else {
      // Payment still pending or processing
      return {
        status: "pending",
        orderId: order.id,
        alreadyConfirmed: false,
      };
    }
  }
}
