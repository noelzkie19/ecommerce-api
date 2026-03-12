export type PaymentMethod = "cod" | "gcash" | "card";

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export type PaymentStatus = "pending" | "paid" | "failed";

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

export interface PaginationMeta {
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
  gcashRedirectUrl: string | null;
  qrCodeUrl: string | null; // QR PH — show this as a QR code image on the frontend
}
