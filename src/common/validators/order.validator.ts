import { z } from "zod";
import { AppError } from "../utils/AppError";

export const createOrderSchema = z.object({
  fullName: z.string().min(1, "fullName is required"),
  email: z.string().email("Invalid email address"),
  phoneNumber: z.string().min(1, "phoneNumber is required"),
  shippingAddress: z.string().min(1, "shippingAddress is required"),
  paymentMethod: z.enum(["gcash", "cod", "card"], {
    errorMap: () => ({ message: "paymentMethod must be gcash, cod, or card" }),
  }),
  discount: z.number().optional(),
  orderNotes: z.string().optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(
    ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"],
    {
      errorMap: () => ({ message: "Invalid order status" }),
    },
  ),
});

export const intentIdParamSchema = z.object({
  intentId: z.string().min(1, "intentId is required"),
});

export const orderIdParamSchema = z.object({
  id: z.string().min(1, "Order ID is required"),
});

export const paginatedQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? Number.parseInt(val, 10) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? Number.parseInt(val, 10) : 10)),
  status: z.string().optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type IntentIdParam = z.infer<typeof intentIdParamSchema>;
export type OrderIdParam = z.infer<typeof orderIdParamSchema>;
export type PaginatedQuery = z.infer<typeof paginatedQuerySchema>;

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
 * Validates and parses the create order input
 * @throws {AppError} if validation fails
 */
export const validateCreateOrder = (data: unknown): CreateOrderInput => {
  try {
    return createOrderSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      handleZodError(error);
    }
    throw error;
  }
};

/**
 * Validates and parses the update order status input
 * @throws {AppError} if validation fails
 */
export const validateUpdateOrderStatus = (
  data: unknown,
): UpdateOrderStatusInput => {
  try {
    return updateOrderStatusSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      handleZodError(error);
    }
    throw error;
  }
};

/**
 * Validates and parses the intent ID parameter
 */
export const validateIntentIdParam = (data: unknown): IntentIdParam => {
  try {
    return intentIdParamSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      handleZodError(error);
    }
    throw error;
  }
};

/**
 * Validates and parses the order ID parameter
 */
export const validateOrderIdParam = (data: unknown): OrderIdParam => {
  try {
    return orderIdParamSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      handleZodError(error);
    }
    throw error;
  }
};

/**
 * Validates and parses pagination query parameters
 */
export const validatePaginatedQuery = (data: unknown): PaginatedQuery => {
  try {
    return paginatedQuerySchema.parse(data);
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
export const safeValidateCreateOrder = (data: unknown) => {
  return createOrderSchema.safeParse(data);
};

export const safeValidateUpdateOrderStatus = (data: unknown) => {
  return updateOrderStatusSchema.safeParse(data);
};
