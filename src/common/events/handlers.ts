import { eventEmitter, AppEvent } from "../events";
import { resolve, TOKENS } from "../../di/container";
import { IAffiliateRepository } from "@/domain/interfaces/IAffiliateRepository";

export function registerEventHandlers(): void {
  eventEmitter.on(
    AppEvent.ORDER_PAYMENT_COMPLETED,
    handleOrderPaymentCompleted,
  );
  eventEmitter.on(AppEvent.ORDER_DELIVERED, handleOrderDelivered);
  eventEmitter.on(
    AppEvent.AFFILIATE_PAYMENT_COMPLETED,
    handleAffiliatePaymentCompleted,
  );
}

async function handleOrderPaymentCompleted(payload: {
  userId: string;
  orderId: string;
  amount: number;
}): Promise<void> {
  try {
    const affiliateRepository = resolve<IAffiliateRepository>(
      TOKENS.IAffiliateRepository,
    );
    const affiliate = await affiliateRepository.findByUserId(payload.userId);

    if (affiliate?.isActive()) {
      console.log(
        `[Event] Recording sale for affiliate ${affiliate.id} from order ${payload.orderId}`,
      );
    }
  } catch (error) {
    console.error("[Event] Error handling order payment completed:", error);
  }
}

async function handleOrderDelivered(payload: {
  orderId: string;
  affiliateId?: string;
}): Promise<void> {
  try {
    if (payload.affiliateId) {
      console.log(
        `[Event] Order ${payload.orderId} delivered, affiliate: ${payload.affiliateId}`,
      );
    }
  } catch (error) {
    console.error("[Event] Error handling order delivered:", error);
  }
}

async function handleAffiliatePaymentCompleted(payload: {
  userId: string;
  affiliateLink?: string;
}): Promise<void> {
  try {
    const affiliateRepository = resolve<IAffiliateRepository>(
      TOKENS.IAffiliateRepository,
    );
    const affiliate = await affiliateRepository.findByUserId(payload.userId);

    if (affiliate) {
      await affiliateRepository.markAsPaidByUserId(payload.userId);
      await affiliateRepository.activateByUserId(payload.userId);
      await affiliateRepository.generateAndSetAffiliateLink(payload.userId);
      console.log(
        `[Event] Affiliate ${affiliate.id} activated for user ${payload.userId}`,
      );
    }
  } catch (error) {
    console.error("[Event] Error handling affiliate payment completed:", error);
  }
}

export function unregisterEventHandlers(): void {
  eventEmitter.removeAllListeners(AppEvent.ORDER_PAYMENT_COMPLETED);
  eventEmitter.removeAllListeners(AppEvent.ORDER_DELIVERED);
  eventEmitter.removeAllListeners(AppEvent.AFFILIATE_PAYMENT_COMPLETED);
}
