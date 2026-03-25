/**
 * Cart Use Cases Index
 *
 * Exports all cart-related use cases.
 */

export {
  GetCartUseCase,
  type GetCartInput,
  type GetCartOutput,
} from "./GetCart";
export {
  AddToCartUseCase,
  type AddToCartInput,
  type AddToCartOutput,
} from "./AddToCart";
export {
  UpdateCartItemUseCase,
  type UpdateCartItemInput,
  type UpdateCartItemOutput,
} from "./UpdateCartItem";
export {
  RemoveFromCartUseCase,
  type RemoveFromCartInput,
  type RemoveFromCartOutput,
} from "./RemoveFromCart";
export {
  ClearCartUseCase,
  type ClearCartInput,
  type ClearCartOutput,
} from "./ClearCart";
