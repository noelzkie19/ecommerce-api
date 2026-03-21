/**
 * Verify GCash Payment Use Case
 *
 * Verifies a PayMongo GCash payment intent.
 * On success: deducts stock, confirms order, records affiliate commissions.
 * On failure: marks payment as failed.
 */

import { IOrderRepository } from "../../../domain/interfaces/IOrderRepository";
import { resolve, TOKENS } from "../../../di/container";
import { AppError } from "../../../common/utils/AppError";
import * as paymongoUtils from "../../../utils/paymongo.utils";
import * as affiliateSalesService from "../../../modules/affiliates-sales/affiliate-sales.repository";
import { firePurchaseEvent } from "../affiliate-pixel";
import {
  activateAffiliateByUserId,
  markAffiliateAsPaidByUserId,
} from "../../../modules/affiliates/affiliate.service";

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
  status: string;
  orderId: string;
  alreadyConfirmed: boolean;
}

/**
 * Verify GCash Payment Use Case
 */
export class VerifyGCashPaymentUseCase {
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
    input: VerifyGCashPaymentInput,
  ): Promise<VerifyGCashPaymentOutput> {
    const status = await paymongoUtils.getPaymentIntentStatus(input.intentId);

    const order = await this.orderRepository.findByIntentId(input.intentId);
    if (!order) {
      throw new AppError("Order not found for this payment intent", 404);
    }

    // Avoid double-processing already confirmed orders
    if (order.isConfirmed()) {
      return { status: "succeeded", orderId: order.id, alreadyConfirmed: true };
    }

    if (status === "succeeded") {
      // Deduct stock now that payment is confirmed
      const items = await this.orderRepository.getItems(order.id);
      await this.orderRepository.deductStock(
        items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      );

      await this.orderRepository.updatePaymentStatus(input.intentId, "paid");
      await this.orderRepository.updateStatus(order.id, "confirmed");
      await affiliateSalesService.recordSalesForOrder(order.id);

      if (order.hasAffiliateAttribution()) {
        try {
          await firePurchaseEvent({
            orderId: order.id,
            affiliateId: order.affiliateId!,
          });
        } catch {
          // Silent fail — pixel event should not block payment confirmation
        }
      }

      if (order.userId) {
        await markAffiliateAsPaidByUserId(order.userId);
        await activateAffiliateByUserId(order.userId);
      }
    } else if (status === "payment_intent.payment_failed") {
      await this.orderRepository.updatePaymentStatus(input.intentId, "failed");
    }

    return { status, orderId: order.id, alreadyConfirmed: false };
  }
}
