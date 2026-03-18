/**
 * IOrderRepository Interface
 *
 * Defines the contract for order data access.
 * This interface is part of the domain layer and should be implemented
 * by the infrastructure layer (e.g., Supabase implementation).
 */

import {
  Order,
  OrderStatus,
  PaymentStatus,
  OrderItem,
  CreateOrderProps,
} from "../entities/Order";
import { PaginatedResult } from "./IAffiliateRepository";

/**
 * Order repository interface
 * Defines all data access operations for orders
 */
export interface IOrderRepository {
  /**
   * Find order by ID
   */
  findById(id: string): Promise<Order | null>;

  /**
   * Find order by payment intent ID
   */
  findByIntentId(intentId: string): Promise<Order | null>;

  /**
   * Find orders by owner (user or guest)
   */
  findByOwner(userId: string | null, guestId: string | null): Promise<Order[]>;

  /**
   * Find all orders with pagination (admin)
   */
  findAllPaginated(
    page: number,
    limit: number,
    status?: OrderStatus,
  ): Promise<PaginatedResult<Order>>;

  /**
   * Find orders by affiliate ID
   */
  findByAffiliateId(affiliateId: string): Promise<Order[]>;

  /**
   * Create a new order
   */
  create(props: CreateOrderProps): Promise<Order>;

  /**
   * Update order status
   */
  updateStatus(id: string, status: OrderStatus): Promise<Order>;

  /**
   * Update payment status
   */
  updatePaymentStatus(intentId: string, status: PaymentStatus): Promise<void>;

  /**
   * Add order items
   */
  addItems(orderId: string, items: CreateOrderItem[]): Promise<OrderItem[]>;

  /**
   * Get order items
   */
  getItems(orderId: string): Promise<OrderItem[]>;

  /**
   * Deduct stock for order items
   */
  deductStock(items: StockDeductionItem[]): Promise<void>;

  /**
   * Restore stock for cancelled order
   */
  restoreStock(orderId: string): Promise<void>;
}

/**
 * Stock deduction item
 */
export interface StockDeductionItem {
  productId: string;
  quantity: number;
}

/**
 * Create order item data
 */
export interface CreateOrderItem {
  productId: string;
  quantity: number;
  unitPrice: number;
}
