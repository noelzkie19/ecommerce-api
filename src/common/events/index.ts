/**
 * Event System for Module Decoupling
 *
 * This module provides an event-driven communication system that allows
 * modules to communicate without direct dependencies.
 *
 * Instead of:
 *   await affiliateService.activateAffiliateByUserId(userId);
 *
 * Use:
 *   eventEmitter.emit('order.payment.completed', { userId, orderId });
 */

import { EventEmitter } from "node:events";

/**
 * Event types for the application
 */
export enum AppEvent {
  // Order events
  ORDER_CREATED = "order.created",
  ORDER_PAYMENT_COMPLETED = "order.payment.completed",
  ORDER_PAYMENT_FAILED = "order.payment.failed",
  ORDER_DELIVERED = "order.delivered",
  ORDER_CANCELLED = "order.cancelled",

  // Affiliate events
  AFFILIATE_REGISTERED = "affiliate.registered",
  AFFILIATE_ACTIVATED = "affiliate.activated",
  AFFILIATE_PAYMENT_COMPLETED = "affiliate.payment.completed",
  AFFILIATE_SALE_RECORDED = "affiliate.sale.recorded",

  // User events
  USER_REGISTERED = "user.registered",
  USER_LOGGED_IN = "user.logged_in",
}

/**
 * Event payload types
 */
export interface OrderPaymentCompletedPayload {
  userId: string;
  orderId: string;
  amount: number;
}

export interface AffiliateActivatedPayload {
  userId: string;
  affiliateId: string;
}

export interface AffiliateSaleRecordedPayload {
  orderId: string;
  affiliateId: string;
  commission: number;
}

export interface AffiliateRegisteredPayload {
  userId: string;
  email: string;
  referralCode?: string;
}

/**
 * Application Event Emitter
 *
 * Singleton event emitter for the entire application.
 */
class ApplicationEventEmitter extends EventEmitter {
  private static instance: ApplicationEventEmitter;

  private constructor() {
    super();
    // Set max listeners to avoid warnings
    this.setMaxListeners(100);
  }

  static getInstance(): ApplicationEventEmitter {
    if (!ApplicationEventEmitter.instance) {
      ApplicationEventEmitter.instance = new ApplicationEventEmitter();
    }
    return ApplicationEventEmitter.instance;
  }
}

// Export singleton instance
export const eventEmitter = ApplicationEventEmitter.getInstance();

// Export convenience methods
export const emit = (event: AppEvent, payload: any): void => {
  eventEmitter.emit(event, payload);
};

export const on = (event: AppEvent, handler: (payload: any) => void): void => {
  eventEmitter.on(event, handler);
};

export const off = (event: AppEvent, handler: (payload: any) => void): void => {
  eventEmitter.off(event, handler);
};

export const once = (
  event: AppEvent,
  handler: (payload: any) => void,
): void => {
  eventEmitter.once(event, handler);
};
