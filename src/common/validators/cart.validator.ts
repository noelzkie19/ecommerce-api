import { z } from "zod";
import { AppError } from "../utils/AppError";

export const addToCartSchema = z.object({
  productId: z.string().min(1, "productId is required"),
  quantity: z.number().int().positive("Quantity must be at least 1").default(1),
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().positive("Quantity must be at least 1"),
});

export const cartItemIdParamSchema = z.object({
  id: z.string().min(1, "Cart item ID is required"),
});

export type AddToCartInput = z.infer<typeof addToCartSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;
export type CartItemIdParam = z.infer<typeof cartItemIdParamSchema>;

/**
 * Helper to convert ZodError to AppError
 */
const handleZodError = (error: z.ZodError): never => {
  const firstError = error.errors[0];
  const message = firstError
    ? `${firstError.path.join(".")}: ${firstError.message}`
    : "Validation failed";
  throw new AppError(message, 400);
};

/**
 * Validates and parses the add to cart input
 * @throws {AppError} if validation fails
 */
export const validateAddToCart = (data: unknown): AddToCartInput => {
  try {
    return addToCartSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      handleZodError(error);
    }
    throw error;
  }
};

/**
 * Validates and parses the update cart item input
 * @throws {AppError} if validation fails
 */
export const validateUpdateCartItem = (data: unknown): UpdateCartItemInput => {
  try {
    return updateCartItemSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      handleZodError(error);
    }
    throw error;
  }
};

/**
 * Validates and parses the cart item ID parameter
 */
export const validateCartItemIdParam = (data: unknown): CartItemIdParam => {
  try {
    return cartItemIdParamSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      handleZodError(error);
    }
    throw error;
  }
};

/**
 * Safe validation that returns errors instead of throwing
 */
export const safeValidateAddToCart = (data: unknown) => {
  return addToCartSchema.safeParse(data);
};

export const safeValidateUpdateCartItem = (data: unknown) => {
  return updateCartItemSchema.safeParse(data);
};
