/**
 * Supabase Cart Repository
 *
 * Implements ICartRepository using Supabase as the data source.
 */

import { supabaseAdmin } from "../../../config/supabase";
import { AppError } from "../../../common/utils/AppError";
import {
  CartItem,
  CartOwner,
  AddToCartProps,
  CartItemDatabaseRow,
  CartItemWithProductDatabaseRow,
} from "../../../domain/entities/CartItem";
import { ICartRepository } from "../../../domain/interfaces/ICartRepository";

const CART_ITEM_FIELDS = `id, user_id, guest_id, product_id, quantity, created_at, updated_at` as const;

const CART_ITEM_WITH_PRODUCT_FIELDS = `
  id,
  user_id,
  guest_id,
  product_id,
  quantity,
  created_at,
  updated_at,
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
` as const;

export class SupabaseCartRepository implements ICartRepository {
  private readonly db = supabaseAdmin as any;

  /**
   * Apply owner filter to a Supabase query
   */
  private applyOwnerFilter<T>(query: T, owner: CartOwner): T {
    const q = query as any;
    if (owner.userId) return q.eq("user_id", owner.userId);
    if (owner.guestId) return q.eq("guest_id", owner.guestId);
    throw new AppError("No cart owner provided", 400);
  }

  /**
   * Find a single cart item by owner and product ID (internal helper)
   */
  private async findItem(
    owner: CartOwner,
    productId: string,
  ): Promise<CartItem | null> {
    let query = this.db
      .from("cart_items")
      .select(CART_ITEM_FIELDS)
      .eq("product_id", productId)
      .maybeSingle();

    query = this.applyOwnerFilter(query, owner);

    const { data, error } = await query;
    if (error) throw new AppError(error.message, 500);
    if (!data) return null;
    return CartItem.fromDatabase(data as CartItemDatabaseRow);
  }

  async findAllByOwner(owner: CartOwner): Promise<CartItem[]> {
    let query = this.db
      .from("cart_items")
      .select(CART_ITEM_WITH_PRODUCT_FIELDS)
      .order("created_at", { ascending: false });

    query = this.applyOwnerFilter(query, owner);

    const { data, error } = await query;
    if (error) throw new AppError(error.message, 500);
    return (data as CartItemWithProductDatabaseRow[]).map(
      CartItem.fromDatabaseWithProduct,
    );
  }

  async upsert(owner: CartOwner, props: AddToCartProps): Promise<CartItem> {
    const existing = await this.findItem(owner, props.productId);

    if (existing) {
      const { data, error } = await this.db
        .from("cart_items")
        .update({ quantity: existing.quantity + props.quantity })
        .eq("id", existing.id)
        .select(CART_ITEM_FIELDS)
        .single();
      if (error) throw new AppError(error.message, 500);
      return CartItem.fromDatabase(data as CartItemDatabaseRow);
    }

    const { data, error } = await this.db
      .from("cart_items")
      .insert({
        user_id: owner.userId ?? null,
        guest_id: owner.guestId ?? null,
        product_id: props.productId,
        quantity: props.quantity,
      })
      .select(CART_ITEM_FIELDS)
      .single();
    if (error) throw new AppError(error.message, 500);
    return CartItem.fromDatabase(data as CartItemDatabaseRow);
  }

  async updateQuantity(
    id: string,
    owner: CartOwner,
    quantity: number,
  ): Promise<CartItem> {
    let query = this.db
      .from("cart_items")
      .update({ quantity })
      .eq("id", id)
      .select(CART_ITEM_FIELDS)
      .single();

    query = this.applyOwnerFilter(query, owner);

    const { data, error } = await query;
    if (error) throw new AppError("Cart item not found", 404);
    return CartItem.fromDatabase(data as CartItemDatabaseRow);
  }

  async remove(id: string, owner: CartOwner): Promise<void> {
    let query = this.db.from("cart_items").delete().eq("id", id);
    query = this.applyOwnerFilter(query, owner);

    const { error } = await query;
    if (error) throw new AppError("Cart item not found", 404);
  }

  async clearCart(owner: CartOwner): Promise<void> {
    let query = this.db.from("cart_items").delete();
    query = this.applyOwnerFilter(query, owner);

    const { error } = await query;
    if (error) throw new AppError(error.message, 500);
  }

  async mergeGuestCart(guestId: string, userId: string): Promise<void> {
    const guestItems = await this.findAllByOwner({ guestId });
    for (const item of guestItems) {
      await this.upsert(
        { userId },
        { productId: item.productId, quantity: item.quantity },
      );
    }
    await this.clearCart({ guestId });
  }
}
