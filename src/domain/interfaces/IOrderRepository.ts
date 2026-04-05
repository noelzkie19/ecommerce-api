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
import type { CartOwner } from "./ICartRepository";

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
  updateStatus(
    id: string,
    status: OrderStatus,
    trackingNumber?: string,
  ): Promise<Order>;

  /**
   * Update payment status by payment intent ID
   */
  updatePaymentStatus(intentId: string, status: PaymentStatus): Promise<void>;

  /**
   * Update payment status by order ID (for COD orders)
   */
  updatePaymentStatusById(
    orderId: string,
    status: PaymentStatus,
  ): Promise<void>;

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

  /**
   * Find order by ID with items and products (for controller)
   */
  findOrderById(id: string): Promise<any>;

  /**
   * Find orders by owner with items and products (for controller)
   */
  findOrdersByOwner(owner: CartOwner): Promise<any[]>;

  /**
   * Find all orders with pagination and items (for controller)
   */
  findAllOrders(
    page: number,
    limit: number,
    status?: OrderStatus,
  ): Promise<{
    data: any[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }>;
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
