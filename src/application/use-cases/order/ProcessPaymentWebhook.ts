/**
 * Process Payment Webhook Use Case
 *
 * Processes PayMongo webhook events for payment status updates.
 * This is called by the backend when PayMongo sends a webhook notification.
 */

import { IOrderRepository } from "../../../domain/interfaces/IOrderRepository";
import { resolve, TOKENS } from "../../../di/container";

/**
 * Input DTO for ProcessPaymentWebhookUseCase
 */
export interface ProcessPaymentWebhookInput {
  eventType: string;
  paymentIntentId: string;
}

/**
 * Output DTO for ProcessPaymentWebhookUseCase
 */
export interface ProcessPaymentWebhookOutput {
  success: boolean;
  orderId: string | null;
  message: string;
}

/**
 * Process Payment Webhook Use Case
 */
export class ProcessPaymentWebhookUseCase {
  private readonly orderRepository: IOrderRepository;

  constructor(orderRepository?: IOrderRepository) {
    this.orderRepository =
      orderRepository ?? resolve<IOrderRepository>(TOKENS.IOrderRepository);
  }

  /**
   * Execute the use case
   */
  async execute(
    input: ProcessPaymentWebhookInput,
  ): Promise<ProcessPaymentWebhookOutput> {
    // 1. Find the order by payment intent ID
    const order = await this.orderRepository.findByIntentId(
      input.paymentIntentId,
    );

    if (!order) {
      return {
        success: true, // Still return success so PayMongo doesn't retry
        orderId: null,
        message: "Order not found, ignoring webhook",
      };
    }

    // 2. Handle based on event type
    if (input.eventType === "payment.paid") {
      // Payment successful - update order status
      await this.orderRepository.updatePaymentStatus(
        input.paymentIntentId,
        "paid",
      );

      // Only update order status if it's still pending
      if (order.status === "pending") {
        await this.orderRepository.updateStatus(order.id, "confirmed");
      }

      return {
        success: true,
        orderId: order.id,
        message: "Payment confirmed",
      };
    } else if (input.eventType === "payment.failed") {
      // Payment failed - update order status
      await this.orderRepository.updatePaymentStatus(
        input.paymentIntentId,
        "failed",
      );
      await this.orderRepository.updateStatus(order.id, "cancelled");

      return {
        success: true,
        orderId: order.id,
        message: "Payment failed, order cancelled",
      };
    } else if (input.eventType === "payment.refunded") {
      // Payment refunded - update order status
      await this.orderRepository.updatePaymentStatus(
        input.paymentIntentId,
        "refunded",
      );

      return {
        success: true,
        orderId: order.id,
        message: "Payment refunded",
      };
    }

    // Unknown event type - still return success to prevent retries
    return {
      success: true,
      orderId: order.id,
      message: `Unhandled event type: ${input.eventType}`,
    };
  }
}
