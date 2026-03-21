/**
 * Supabase Order Repository
 *
 * Implements IOrderRepository using Supabase as the data source.
 * Handles order creation, stock deduction/restoration, and payment status updates.
 */

import { supabaseAdmin } from "../../../config/supabase";
import { AppError } from "../../../common/utils/AppError";
import {
  Order,
  OrderItem,
  OrderStatus,
  PaymentStatus,
  CreateOrderProps,
  OrderDatabaseRow,
  OrderItemDatabaseRow,
  OrderItemProduct,
} from "../../../domain/entities/Order";
import {
  IOrderRepository,
  StockDeductionItem,
  CreateOrderItem,
} from "../../../domain/interfaces/IOrderRepository";
import { PaginatedResult } from "../../../domain/interfaces/IAffiliateRepository";

const ORDER_WITH_ITEMS_FIELDS = `
  *,
  items:order_items (
    *,
    product:products (
      id,
      name,
      price,
      image_url,
      images:product_images (
        id,
        url,
        position
      )
    )
  )
` as const;

export class SupabaseOrderRepository implements IOrderRepository {
  private readonly db = supabaseAdmin as any;

  /**
   * Map a raw Supabase order row (with joined items) to an Order entity
   */
  private mapToOrder(row: any): Order {
    const items = (row.items ?? []).map((item: any) => {
      const productRaw = item.product ?? null;
      const product: OrderItemProduct | null = productRaw
        ? {
            id: productRaw.id,
            name: productRaw.name,
            price: productRaw.price,
            imageUrl: productRaw.image_url,
            primaryImageUrl:
              productRaw.images && productRaw.images.length > 0
                ? [...productRaw.images].sort(
                    (a: any, b: any) => a.position - b.position,
                  )[0].url
                : productRaw.image_url,
            images: productRaw.images ?? [],
          }
        : null;

      return new OrderItem({
        id: item.id,
        orderId: item.order_id,
        productId: item.product_id,
        quantity: item.quantity,
        unitPrice: item.unit_price,
        product,
      });
    });

    return Order.fromDatabase(row as OrderDatabaseRow, items);
  }

  async findById(id: string): Promise<Order | null> {
    const { data, error } = await this.db
      .from("orders")
      .select(ORDER_WITH_ITEMS_FIELDS)
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw new AppError(error.message, 500);
    }
    return this.mapToOrder(data);
  }

  async findByIntentId(intentId: string): Promise<Order | null> {
    const { data, error } = await this.db
      .from("orders")
      .select("id, status, payment_status, user_id, guest_id, affiliate_id")
      .eq("payment_intent_id", intentId)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw new AppError(error.message, 500);
    }

    return Order.fromDatabase(data as OrderDatabaseRow, []);
  }

  async findByOwner(
    userId: string | null,
    guestId: string | null,
  ): Promise<Order[]> {
    if (!userId && !guestId) throw new AppError("No owner provided", 400);

    let query = this.db
      .from("orders")
      .select(ORDER_WITH_ITEMS_FIELDS)
      .order("created_at", { ascending: false });

    if (userId) query = query.eq("user_id", userId);
    else query = query.eq("guest_id", guestId);

    const { data, error } = await query;
    if (error) throw new AppError(error.message, 500);
    return (data ?? []).map((row: any) => this.mapToOrder(row));
  }

  async findAllPaginated(
    page: number,
    limit: number,
    status?: OrderStatus,
  ): Promise<PaginatedResult<Order>> {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let countQuery = this.db
      .from("orders")
      .select("id", { count: "exact", head: true });
    if (status) countQuery = countQuery.eq("status", status);

    const { count, error: countError } = await countQuery;
    if (countError) throw new AppError(countError.message, 500);

    let dataQuery = this.db
      .from("orders")
      .select(ORDER_WITH_ITEMS_FIELDS)
      .order("created_at", { ascending: false })
      .range(from, to);
    if (status) dataQuery = dataQuery.eq("status", status);

    const { data, error } = await dataQuery;
    if (error) throw new AppError(error.message, 500);

    return {
      data: (data ?? []).map((row: any) => this.mapToOrder(row)),
      meta: {
        total: count ?? 0,
        page,
        limit,
        totalPages: Math.ceil((count ?? 0) / limit),
      },
    };
  }

  async findByAffiliateId(affiliateId: string): Promise<Order[]> {
    const { data, error } = await this.db
      .from("orders")
      .select(ORDER_WITH_ITEMS_FIELDS)
      .eq("affiliate_id", affiliateId)
      .order("created_at", { ascending: false });

    if (error) throw new AppError(error.message, 500);
    return (data ?? []).map((row: any) => this.mapToOrder(row));
  }

  async create(props: CreateOrderProps): Promise<Order> {
    const { data, error } = await this.db
      .from("orders")
      .insert({
        id: props.id,
        user_id: props.userId ?? null,
        guest_id: props.guestId ?? null,
        full_name: props.fullName,
        email: props.email,
        phone_number: props.phoneNumber,
        shipping_address: props.shippingAddress,
        order_notes: props.orderNotes ?? null,
        payment_method: props.paymentMethod,
        payment_status: "pending",
        status: "pending",
        subtotal: props.subtotal,
        discount: props.discount ?? 0,
        total: props.total,
        payment_intent_id: props.paymentIntentId ?? null,
        affiliate_id: props.affiliateId ?? null,
        tracking_method: props.trackingMethod ?? null,
        click_id: props.clickId ?? null,
      })
      .select("*")
      .single();

    if (error) throw new AppError(error.message, 500);
    return Order.fromDatabase(data as OrderDatabaseRow, []);
  }

  async updateStatus(id: string, status: OrderStatus): Promise<Order> {
    const { error } = await this.db
      .from("orders")
      .update({ status })
      .eq("id", id);

    if (error) throw new AppError(error.message, 500);

    const order = await this.findById(id);
    if (!order) throw new AppError("Order not found", 404);
    return order;
  }

  async updatePaymentStatus(
    intentId: string,
    status: PaymentStatus,
  ): Promise<void> {
    const { error } = await this.db
      .from("orders")
      .update({ payment_status: status })
      .eq("payment_intent_id", intentId);

    if (error) throw new AppError(error.message, 500);
  }

  async addItems(
    orderId: string,
    items: CreateOrderItem[],
  ): Promise<OrderItem[]> {
    const rows = items.map((item) => ({
      order_id: orderId,
      product_id: item.productId,
      quantity: item.quantity,
      unit_price: item.unitPrice,
    }));

    const { data, error } = await this.db
      .from("order_items")
      .insert(rows)
      .select("*");

    if (error) throw new AppError(error.message, 500);

    return (data as OrderItemDatabaseRow[]).map(
      (row) =>
        new OrderItem({
          id: row.id,
          orderId: row.order_id,
          productId: row.product_id,
          quantity: row.quantity,
          unitPrice: row.unit_price,
          product: null,
        }),
    );
  }

  async getItems(orderId: string): Promise<OrderItem[]> {
    const { data, error } = await this.db
      .from("order_items")
      .select("*")
      .eq("order_id", orderId);

    if (error) throw new AppError(error.message, 500);

    return (data as OrderItemDatabaseRow[]).map(
      (row) =>
        new OrderItem({
          id: row.id,
          orderId: row.order_id,
          productId: row.product_id,
          quantity: row.quantity,
          unitPrice: row.unit_price,
          product: null,
        }),
    );
  }

  async deductStock(items: StockDeductionItem[]): Promise<void> {
    for (const item of items) {
      const { data: stock, error: fetchError } = await this.db
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

      const { error: updateError } = await this.db
        .from("stock")
        .update({ quantity: stock.quantity - item.quantity })
        .eq("id", stock.id);

      if (updateError) throw new AppError(updateError.message, 500);
    }
  }

  async restoreStock(orderId: string): Promise<void> {
    const { data: items, error } = await this.db
      .from("order_items")
      .select("product_id, quantity")
      .eq("order_id", orderId);

    if (error) throw new AppError(error.message, 500);

    for (const item of items ?? []) {
      const { data: stock } = await this.db
        .from("stock")
        .select("id, quantity")
        .eq("product_id", item.product_id)
        .single();

      if (!stock) continue;

      await this.db
        .from("stock")
        .update({ quantity: stock.quantity + item.quantity })
        .eq("id", stock.id);
    }
  }
}
