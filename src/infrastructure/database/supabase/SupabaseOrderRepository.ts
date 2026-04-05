/**
 * Supabase Order Repository
 *
 * Implements IOrderRepository using Supabase as the data store.
 * This is part of the infrastructure layer.
 */

import { supabaseAdmin } from "../../../config/supabase";
import { AppError } from "../../../common/utils/AppError";
import {
  IOrderRepository,
  StockDeductionItem,
  CreateOrderItem,
} from "../../../domain/interfaces/IOrderRepository";
import {
  Order,
  OrderStatus,
  PaymentStatus,
  OrderItem,
  CreateOrderProps,
} from "../../../domain/entities/Order";
import { PaginatedResult } from "../../../domain/interfaces/IAffiliateRepository";
import type { CartOwner } from "../../../domain/interfaces/ICartRepository";

/**
 * Supabase implementation of IOrderRepository
 */
export class SupabaseOrderRepository implements IOrderRepository {
  /**
   * Find order by ID
   */
  async findById(id: string): Promise<Order | null> {
    const { data, error } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("id", id)
      .single();

    if (error) return null;

    const items = await this.getItems(id);
    return Order.fromDatabase(data, items);
  }

  /**
   * Find order by payment intent ID
   */
  async findByIntentId(intentId: string): Promise<Order | null> {
    const { data, error } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("payment_intent_id", intentId)
      .single();

    if (error) return null;

    const items = await this.getItems(data.id);
    return Order.fromDatabase(data, items);
  }

  /**
   * Find orders by owner (user or guest)
   */
  async findByOwner(
    userId: string | null,
    guestId: string | null,
  ): Promise<Order[]> {
    let query = supabaseAdmin.from("orders").select("*");

    if (userId) {
      query = query.eq("user_id", userId);
    } else if (guestId) {
      query = query.eq("guest_id", guestId);
    } else {
      return [];
    }

    const { data, error } = await query.order("created_at", {
      ascending: false,
    });

    if (error) throw new AppError(error.message, 500);

    return (data ?? []).map((row) => Order.fromDatabase(row, []));
  }

  /**
   * Find all orders with pagination (admin)
   */
  async findAllPaginated(
    page: number,
    limit: number,
    status?: OrderStatus,
  ): Promise<PaginatedResult<Order>> {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let countQuery = supabaseAdmin
      .from("orders")
      .select("id", { count: "exact", head: true });

    if (status) countQuery = countQuery.eq("status", status);

    const { count, error: countError } = await countQuery;
    if (countError) throw new AppError(countError.message, 500);

    let dataQuery = supabaseAdmin
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .range(from, to);

    if (status) dataQuery = dataQuery.eq("status", status);

    const { data, error } = await dataQuery;

    if (error) throw new AppError(error.message, 500);

    const orders = (data ?? []).map((row) => Order.fromDatabase(row, []));

    return {
      data: orders,
      meta: {
        total: count ?? 0,
        page,
        limit,
        totalPages: Math.ceil((count ?? 0) / limit),
      },
    };
  }

  /**
   * Find orders by affiliate ID
   */
  async findByAffiliateId(affiliateId: string): Promise<Order[]> {
    const { data, error } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("affiliate_id", affiliateId)
      .order("created_at", { ascending: false });

    if (error) throw new AppError(error.message, 500);

    return (data ?? []).map((row) => Order.fromDatabase(row, []));
  }

  /**
   * Create a new order
   */
  async create(props: CreateOrderProps): Promise<Order> {
    const { data, error } = await supabaseAdmin
      .from("orders")
      .insert({
        id: props.id,
        user_id: props.userId,
        guest_id: props.guestId,
        full_name: props.fullName,
        email: props.email,
        phone_number: props.phoneNumber,
        shipping_address: props.shippingAddress,
        order_notes: props.orderNotes,
        payment_method: props.paymentMethod,
        payment_status: "pending",
        status: "pending",
        subtotal: props.subtotal,
        discount: props.discount,
        total: props.total,
        payment_intent_id: props.paymentIntentId,
        affiliate_id: props.affiliateId,
        tracking_method: props.trackingMethod,
        click_id: props.clickId,
      })
      .select()
      .single();

    if (error) throw new AppError(error.message, 500);

    return Order.fromDatabase(data, []);
  }

  /**
   * Update order status
   * For COD orders: when status changes to 'delivered', payment_status is automatically set to 'paid'
   */
  async updateStatus(
    id: string,
    status: OrderStatus,
    trackingNumber?: string,
  ): Promise<Order> {
    // First fetch the order to check payment method and current status
    const { data: existingOrder, error: fetchError } = await supabaseAdmin
      .from("orders")
      .select("id, payment_method, payment_status, status")
      .eq("id", id)
      .single();

    if (fetchError || !existingOrder) {
      throw new AppError("Order not found", 404);
    }

    // For COD orders: auto-update payment_status to 'paid' when status becomes 'delivered'
    const isCOD = existingOrder.payment_method === "cod";
    const isDelivering = status === "delivered";
    const isPendingPayment = existingOrder.payment_status === "pending";

    let updateData: Record<string, any> = {
      status,
    };

    // If COD order is being delivered and payment is still pending, mark as paid
    if (isCOD && isDelivering && isPendingPayment) {
      updateData.payment_status = "paid";
    }

    // Add tracking number if provided
    if (trackingNumber !== undefined) {
      updateData.tracking_number = trackingNumber;
    }

    const { data, error } = await supabaseAdmin
      .from("orders")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw new AppError("Order not found", 404);

    const items = await this.getItems(id);
    return Order.fromDatabase(data, items);
  }

  /**
   * Update payment status by payment intent ID
   */
  async updatePaymentStatus(
    intentId: string,
    status: PaymentStatus,
  ): Promise<void> {
    const { error } = await supabaseAdmin
      .from("orders")
      .update({ payment_status: status })
      .eq("payment_intent_id", intentId);

    if (error) throw new AppError(error.message, 500);
  }

  /**
   * Update payment status by order ID (for COD orders — admin manual tagging)
   */
  async updatePaymentStatusById(
    orderId: string,
    status: PaymentStatus,
  ): Promise<void> {
    const { error } = await supabaseAdmin
      .from("orders")
      .update({ payment_status: status, updated_at: new Date().toISOString() })
      .eq("id", orderId);

    if (error) throw new AppError(error.message, 500);
  }

  /**
   * Add order items
   */
  async addItems(
    orderId: string,
    items: CreateOrderItem[],
  ): Promise<OrderItem[]> {
    const orderItems = items.map((item) => ({
      order_id: orderId,
      product_id: item.productId,
      quantity: item.quantity,
      unit_price: item.unitPrice,
    }));

    const { data, error } = await supabaseAdmin
      .from("order_items")
      .insert(orderItems as any)
      .select();

    if (error) throw new AppError(error.message, 500);

    return (data ?? []).map(
      (row: any) =>
        new OrderItem({
          id: row.id,
          orderId: row.order_id,
          productId: row.product_id,
          quantity: row.quantity,
          unitPrice: row.unit_price,
        }),
    );
  }

  /**
   * Get order items
   */
  async getItems(orderId: string): Promise<OrderItem[]> {
    const { data, error } = await supabaseAdmin
      .from("order_items")
      .select("*")
      .eq("order_id", orderId);

    if (error) throw new AppError(error.message, 500);

    return (data ?? []).map(
      (row: any) =>
        new OrderItem({
          id: row.id,
          orderId: row.order_id,
          productId: row.product_id,
          quantity: row.quantity,
          unitPrice: row.unit_price,
        }),
    );
  }

  /**
   * Deduct stock for order items
   */
  async deductStock(items: StockDeductionItem[]): Promise<void> {
    for (const item of items) {
      const { data: stock, error: fetchError } = await supabaseAdmin
        .from("stock")
        .select("id, quantity")
        .eq("product_id", item.productId)
        .single();

      if (fetchError || !stock) {
        throw new AppError(
          `Stock not found for product ${item.productId}`,
          400,
        );
      }

      if (stock.quantity < item.quantity) {
        throw new AppError(
          `Insufficient stock for product ${item.productId}`,
          400,
        );
      }

      const { error: updateError } = await supabaseAdmin
        .from("stock")
        .update({ quantity: stock.quantity - item.quantity })
        .eq("id", stock.id);

      if (updateError) throw new AppError(updateError.message, 500);
    }
  }

  /**
   * Restore stock for cancelled order
   */
  async restoreStock(orderId: string): Promise<void> {
    const { data: items, error } = await supabaseAdmin
      .from("order_items")
      .select("product_id, quantity")
      .eq("order_id", orderId);

    if (error) throw new AppError(error.message, 500);

    for (const item of items ?? []) {
      const { data: stock, error: fetchError } = await supabaseAdmin
        .from("stock")
        .select("id, quantity")
        .eq("product_id", item.product_id)
        .single();

      if (fetchError || !stock) continue;

      await supabaseAdmin
        .from("stock")
        .update({ quantity: stock.quantity + item.quantity })
        .eq("id", stock.id);
    }
  }

  /**
   * Find order by ID with items and products (for controller)
   */
  async findOrderById(id: string): Promise<any> {
    const { data, error } = await (supabaseAdmin
      .from("orders")
      .select(
        `
        *,
        items:order_items (
          *,
          product:products (
            id, name, price, image_url,
            images:product_images ( id, url, position )
          )
        )
      `,
      )
      .eq("id", id)
      .single() as unknown as Promise<{ data: any; error: any }>);

    if (error) throw new AppError(error.message, 500);
    return data;
  }

  /**
   * Find orders by owner with items and products (for controller)
   */
  async findOrdersByOwner(owner: CartOwner): Promise<any[]> {
    let query = supabaseAdmin
      .from("orders")
      .select(
        `
        *,
        items:order_items (
          *,
          product:products (
            id, name, price, image_url,
            images:product_images ( id, url, position )
          )
        )
      `,
      )
      .order("created_at", { ascending: false }) as unknown as any;

    if (owner.userId) query = query.eq("user_id", owner.userId);
    else if (owner.guestId) query = query.eq("guest_id", owner.guestId);
    else throw new AppError("No owner provided", 400);

    const { data, error } = (await query) as { data: any[]; error: any };
    if (error) throw new AppError(error.message, 500);
    return data;
  }

  /**
   * Find all orders with pagination and items (for controller)
   */
  async findAllOrders(
    page: number,
    limit: number,
    status?: OrderStatus,
  ): Promise<{
    data: any[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let countQuery = supabaseAdmin
      .from("orders")
      .select("id", { count: "exact", head: true });

    if (status) countQuery = countQuery.eq("status", status as any);

    const { count, error: countError } = await countQuery;
    if (countError) throw new AppError(countError.message, 500);

    let dataQuery = supabaseAdmin
      .from("orders")
      .select(
        `
        *,
        items:order_items (
          *,
          product:products (
            id, name, price, image_url,
            images:product_images ( id, url, position )
          )
        )
      `,
      )
      .order("created_at", { ascending: false })
      .range(from, to);

    if (status) dataQuery = dataQuery.eq("status", status as any);

    const { data, error } = await dataQuery;
    if (error) throw new AppError(error.message, 500);

    return {
      data,
      meta: {
        total: count ?? 0,
        page,
        limit,
        totalPages: Math.ceil((count ?? 0) / limit),
      },
    };
  }
}
