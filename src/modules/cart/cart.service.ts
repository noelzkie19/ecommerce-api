import * as cartRepository from "./cart.repository";
import { AddToCartDTO, CartOwner, UpdateCartItemDTO } from "./cart.types";

export const getCart = (owner: CartOwner) =>
  cartRepository.findAllByOwner(owner);

export const addToCart = (owner: CartOwner, dto: AddToCartDTO) =>
  cartRepository.upsert(owner, dto);

export const updateCartItem = (
  id: string,
  owner: CartOwner,
  dto: UpdateCartItemDTO,
) => cartRepository.updateQuantity(id, owner, dto.quantity);

export const removeFromCart = (id: string, owner: CartOwner) =>
  cartRepository.remove(id, owner);

export const clearCart = (owner: CartOwner) => cartRepository.clearCart(owner);

export const mergeGuestCart = (guestId: string, userId: string) =>
  cartRepository.mergeGuestCart(guestId, userId);
