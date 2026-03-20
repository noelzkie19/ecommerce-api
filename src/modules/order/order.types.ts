// Import types from domain for local use
import type {
  PaymentMethod,
  OrderStatus,
  PaymentStatus,
} from "../../domain/entities/Order";

// Re-export from domain
export type {
  PaymentMethod,
  OrderStatus,
  PaymentStatus,
} from "../../domain/entities/Order";

// Also export using module-specific names for backwards compatibility
export type { PaymentMethod as OrderPaymentMethod } from "../../domain/entities/Order";
export type { OrderStatus as OrderOrderStatus } from "../../domain/entities/Order";
export type { PaymentStatus as OrderPaymentStatus } from "../../domain/entities/Order";

// DTOs
export interface CreateOrderDTO {
  fullName: string;
  email: string;
  phoneNumber: string;
  shippingAddress: string;
  orderNotes?: string;
  paymentMethod: PaymentMethod;
  discount?: number;
}

export interface UpdateOrderStatusDTO {
  status: OrderStatus;
}

// Order with items (includes joined product data - not in domain)
export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  product: {
    id: string;
    name: string;
    price: number;
    image_url: string | null;
    images?: { id: string; url: string; position: number }[];
  };
}

export interface Order {
  id: string;
  userId: string | null;
  guestId: string | null;
  fullName: string;
  email: string;
  phoneNumber: string;
  shippingAddress: string;
  orderNotes: string | null;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  subtotal: number;
  total: number;
  paymentIntentId: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
}

// Import PaginationMeta from common types
// Re-export for convenience
export type { PaginationMeta } from "../../common/types";

// For backwards compatibility - can be removed once all imports are updated
// eslint-disable-next-line no-shadow
interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedOrders {
  data: Order[];
  meta: PaginationMeta;
}

export interface PlaceOrderResult {
  order: Order;
  mayaRedirectUrl: string | null; // Maya Wallet deep link - opens Maya app directly
}
