import { supabaseAdmin } from "../../config/supabase";
import { AppError } from "../../common/utils/AppError";
import type { CartOwner } from "../cart/cart.repository";
import type { OrderStatus, PaymentStatus } from "../../domain/entities/Order";

interface CreateOrderDTO {
  fullName: string;
  email: string;
  phoneNumber: string;
  shippingAddress: string;
  orderNotes?: string;
  paymentMethod: string;
  discount?: number;
}

type StockRow = { id: string; quantity: number };
type OrderItemRow = { product_id: string; quantity: number };

const stockTable = () => supabaseAdmin.from("stock") as unknown as any;

// ── Stock helpers ─────────────────────────────────────────────────────────────

export const deductStock = async (cartItems: any[]) => {
  for (const item of cartItems) {
    const productId =
      item.product_id ?? item.productId ?? item.product?.id ?? null;

    if (!productId) {
      throw new AppError("Could not resolve product id from cart item", 500);
    }

    const { data: stock, error: fetchError } = (await stockTable()
      .select("id, quantity")
      .eq("product_id", productId)
      .single()) as { data: StockRow | null; error: any };

    if (fetchError || !stock) {
      throw new AppError(`Stock not found for product ${productId}`, 400);
    }

    if (stock.quantity < item.quantity) {
      throw new AppError(
        `Insufficient stock for "${item.product?.name ?? productId}"`,
        400,
      );
    }

    const { error: updateError } = await stockTable()
      .update({ quantity: stock.quantity - item.quantity })
      .eq("id", stock.id);

    if (updateError) throw new AppError(updateError.message, 500);
  }
};

export const restoreStock = async (orderId: string) => {
  const { data: items, error } = (await supabaseAdmin
    .from("order_items")
    .select("product_id, quantity")
    .eq("order_id", orderId)) as unknown as {
    data: OrderItemRow[] | null;
    error: any;
  };

  if (error) throw new AppError(error.message, 500);

  for (const item of items ?? []) {
    const { data: stock, error: fetchError } = (await stockTable()
      .select("id, quantity")
      .eq("product_id", item.product_id)
      .single()) as { data: StockRow | null; error: any };

    if (fetchError || !stock) continue;

    await stockTable()
      .update({ quantity: stock.quantity + item.quantity })
      .eq("id", stock.id);
  }
};

// ── Order CRUD ────────────────────────────────────────────────────────────────

export const createOrder = async (
  owner: CartOwner,
  dto: CreateOrderDTO,
  cartItems: any[],
  paymentIntentId?: string,
) => {
  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0,
  );

  const discount = dto.discount ?? 0;
  const total = subtotal - discount;

  const { data: order, error: orderError } = (await supabaseAdmin
    .from("orders")
    .insert({
      user_id: owner.userId ?? null,
      guest_id: owner.guestId ?? null,
      full_name: dto.fullName,
      email: dto.email,
      phone_number: dto.phoneNumber,
      shipping_address: dto.shippingAddress,
      order_notes: dto.orderNotes ?? null,
      payment_method: dto.paymentMethod,
      payment_status: "pending",
      status: "pending",
      subtotal,
      total: total,
      payment_intent_id: paymentIntentId ?? null,
    } as any)
    .select("id")
    .single()) as unknown as { data: { id: string } | null; error: any };

  if (orderError) throw new AppError(orderError.message, 500);
  if (!order) throw new AppError("Failed to create order", 500);

  const orderId = order.id;

  const orderItems = cartItems.map((item) => ({
    order_id: orderId,
    product_id: item.product_id ?? item.productId ?? item.product?.id,
    quantity: item.quantity,
    unit_price: item.product.price,
  }));

  const { error: itemsError } = await supabaseAdmin
    .from("order_items")
    .insert(orderItems as any);

  if (itemsError) throw new AppError(itemsError.message, 500);

  return findOrderById(orderId);
};

export const findOrderById = async (id: string): Promise<any> => {
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
};

export const findOrdersByOwner = async (owner: CartOwner): Promise<any[]> => {
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
};

export const findAllOrders = async (
  page: number,
  limit: number,
  status?: OrderStatus,
) => {
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
};

export const updateOrderStatus = async (id: string, status: OrderStatus) => {
  const { error } = await supabaseAdmin
    .from("orders")
    .update({ status } as any)
    .eq("id", id);

  if (error) throw new AppError(error.message, 500);
  return findOrderById(id);
};

// ── Payment helpers ───────────────────────────────────────────────────────────

export const updatePaymentStatus = async (
  intentId: string,
  paymentStatus: PaymentStatus,
) => {
  const { error } = await supabaseAdmin
    .from("orders")
    .update({ payment_status: paymentStatus } as any)
    .eq("payment_intent_id", intentId);

  if (error) throw new AppError(error.message, 500);
};

export const findOrderByIntentId = async (intentId: string) => {
  const { data, error } = (await (supabaseAdmin
    .from("orders")
    .select("id, status, user_id, guest_id")
    .eq("payment_intent_id", intentId)
    .single() as unknown)) as {
    data: {
      id: string;
      status: string;
      user_id: string | null;
      guest_id: string | null;
    } | null;
    error: any;
  };

  if (error) throw new AppError(error.message, 500);
  return data;
};
