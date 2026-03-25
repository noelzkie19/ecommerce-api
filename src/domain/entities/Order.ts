/**
 * Order Entity
 *
 * Represents an order in the e-commerce platform.
 * This is a core domain entity that contains pure business logic.
 */

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";
export type PaymentMethod = "cod" | "maya";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

/**
 * Order entity with business logic
 */
export class Order {
  readonly id: string;
  readonly userId: string | null;
  readonly guestId: string | null;
  readonly fullName: string;
  readonly email: string;
  readonly phoneNumber: string;
  readonly shippingAddress: string;
  readonly orderNotes: string | null;
  readonly paymentMethod: PaymentMethod;
  readonly paymentStatus: PaymentStatus;
  readonly status: OrderStatus;
  readonly subtotal: number;
  readonly discount: number;
  readonly total: number;
  readonly paymentIntentId: string | null;
  readonly affiliateId: string | null;
  readonly trackingMethod: string | null;
  readonly clickId: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  private _items: OrderItem[] = [];

  private constructor(props: OrderProps) {
    this.id = props.id;
    this.userId = props.userId;
    this.guestId = props.guestId;
    this.fullName = props.fullName;
    this.email = props.email;
    this.phoneNumber = props.phoneNumber;
    this.shippingAddress = props.shippingAddress;
    this.orderNotes = props.orderNotes;
    this.paymentMethod = props.paymentMethod;
    this.paymentStatus = props.paymentStatus;
    this.status = props.status;
    this.subtotal = props.subtotal;
    this.discount = props.discount;
    this.total = props.total;
    this.paymentIntentId = props.paymentIntentId;
    this.affiliateId = props.affiliateId;
    this.trackingMethod = props.trackingMethod;
    this.clickId = props.clickId;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  /**
   * Factory method to create a new Order
   */
  static create(props: CreateOrderProps): Order {
    return new Order({
      id: props.id,
      userId: props.userId ?? null,
      guestId: props.guestId ?? null,
      fullName: props.fullName,
      email: props.email,
      phoneNumber: props.phoneNumber,
      shippingAddress: props.shippingAddress,
      orderNotes: props.orderNotes ?? null,
      paymentMethod: props.paymentMethod,
      paymentStatus: "pending",
      status: "pending",
      subtotal: props.subtotal,
      discount: props.discount ?? 0,
      total: props.total,
      paymentIntentId: props.paymentIntentId ?? null,
      affiliateId: props.affiliateId ?? null,
      trackingMethod: props.trackingMethod ?? null,
      clickId: props.clickId ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  /**
   * Create Order from database row
   */
  static fromDatabase(row: OrderDatabaseRow, items: OrderItem[] = []): Order {
    const order = new Order({
      id: row.id,
      userId: row.user_id,
      guestId: row.guest_id,
      fullName: row.full_name,
      email: row.email,
      phoneNumber: row.phone_number,
      shippingAddress: row.shipping_address,
      orderNotes: row.order_notes,
      paymentMethod: row.payment_method,
      paymentStatus: row.payment_status,
      status: row.status,
      subtotal: row.subtotal,
      discount: row.discount ?? 0,
      total: row.total,
      paymentIntentId: row.payment_intent_id,
      affiliateId: row.affiliate_id,
      trackingMethod: row.tracking_method,
      clickId: row.click_id,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    });
    order._items = items;
    return order;
  }

  /**
   * Get order items
   */
  get items(): OrderItem[] {
    return [...this._items];
  }

  /**
   * Set order items
   */
  setItems(items: OrderItem[]): void {
    this._items = items;
  }

  /**
   * Check if order is paid
   */
  isPaid(): boolean {
    return this.paymentStatus === "paid";
  }

  /**
   * Check if order is confirmed
   */
  isConfirmed(): boolean {
    return this.status === "confirmed";
  }

  /**
   * Check if order can be cancelled
   */
  canBeCancelled(): boolean {
    return !["delivered", "cancelled"].includes(this.status);
  }

  /**
   * Check if order has affiliate attribution
   */
  hasAffiliateAttribution(): boolean {
    return this.affiliateId !== null;
  }

  /**
   * Check if order is a guest order
   */
  isGuestOrder(): boolean {
    return this.guestId !== null;
  }

  /**
   * Check if order belongs to a registered user
   */
  isUserOrder(): boolean {
    return this.userId !== null;
  }

  /**
   * Confirm the order (payment received for GCash)
   */
  confirm(): Order {
    if (this.status !== "pending") {
      throw new Error("Order cannot be confirmed");
    }
    return new Order({
      ...this.toProps(),
      status: "confirmed",
      paymentStatus: "paid",
      updatedAt: new Date(),
    });
  }

  /**
   * Mark payment as failed
   */
  markPaymentFailed(): Order {
    return new Order({
      ...this.toProps(),
      paymentStatus: "failed",
      updatedAt: new Date(),
    });
  }

  /**
   * Cancel the order
   */
  cancel(): Order {
    if (!this.canBeCancelled()) {
      throw new Error("Order cannot be cancelled in current state");
    }
    return new Order({
      ...this.toProps(),
      status: "cancelled",
      updatedAt: new Date(),
    });
  }

  /**
   * Update order status to delivered
   */
  deliver(): Order {
    if (this.status !== "shipped") {
      throw new Error("Order must be shipped before delivery");
    }
    return new Order({
      ...this.toProps(),
      status: "delivered",
      updatedAt: new Date(),
    });
  }

  /**
   * Ship the order
   */
  ship(): Order {
    if (this.status !== "processing") {
      throw new Error("Order must be processing before shipping");
    }
    return new Order({
      ...this.toProps(),
      status: "shipped",
      updatedAt: new Date(),
    });
  }

  /**
   * Convert to plain object for response
   */
  toResponse(): OrderResponse {
    return {
      id: this.id,
      userId: this.userId,
      guestId: this.guestId,
      fullName: this.fullName,
      email: this.email,
      phoneNumber: this.phoneNumber,
      shippingAddress: this.shippingAddress,
      orderNotes: this.orderNotes,
      paymentMethod: this.paymentMethod,
      paymentStatus: this.paymentStatus,
      status: this.status,
      subtotal: this.subtotal,
      discount: this.discount,
      total: this.total,
      paymentIntentId: this.paymentIntentId,
      affiliateId: this.affiliateId,
      trackingMethod: this.trackingMethod,
      clickId: this.clickId,
      items: this._items.map((item) => item.toResponse()),
      createdAt:
        this.createdAt && !Number.isNaN(this.createdAt.getTime())
          ? this.createdAt.toISOString()
          : null,
      updatedAt:
        this.updatedAt && !Number.isNaN(this.updatedAt.getTime())
          ? this.updatedAt.toISOString()
          : null,
    };
  }

  private toProps(): OrderProps {
    return {
      id: this.id,
      userId: this.userId,
      guestId: this.guestId,
      fullName: this.fullName,
      email: this.email,
      phoneNumber: this.phoneNumber,
      shippingAddress: this.shippingAddress,
      orderNotes: this.orderNotes,
      paymentMethod: this.paymentMethod,
      paymentStatus: this.paymentStatus,
      status: this.status,
      subtotal: this.subtotal,
      discount: this.discount,
      total: this.total,
      paymentIntentId: this.paymentIntentId,
      affiliateId: this.affiliateId,
      trackingMethod: this.trackingMethod,
      clickId: this.clickId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

/**
 * Order Item value object
 */
export class OrderItem {
  readonly id: string;
  readonly orderId: string;
  readonly productId: string;
  readonly quantity: number;
  readonly unitPrice: number;

  constructor(props: OrderItemProps) {
    this.id = props.id;
    this.orderId = props.orderId;
    this.productId = props.productId;
    this.quantity = props.quantity;
    this.unitPrice = props.unitPrice;
  }

  /**
   * Calculate item total
   */
  get total(): number {
    return this.quantity * this.unitPrice;
  }

  /**
   * Convert to response
   */
  toResponse(): OrderItemResponse {
    return {
      id: this.id,
      orderId: this.orderId,
      productId: this.productId,
      quantity: this.quantity,
      unitPrice: this.unitPrice,
      total: this.total,
    };
  }
}

/**
 * Order properties (internal)
 */
interface OrderProps {
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
  discount: number;
  total: number;
  paymentIntentId: string | null;
  affiliateId: string | null;
  trackingMethod: string | null;
  clickId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * OrderItem properties
 */
interface OrderItemProps {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
}

/**
 * Properties for creating a new Order
 */
export interface CreateOrderProps {
  id: string;
  userId?: string | null;
  guestId?: string | null;
  fullName: string;
  email: string;
  phoneNumber: string;
  shippingAddress: string;
  orderNotes?: string | null;
  paymentMethod: PaymentMethod;
  subtotal: number;
  discount?: number;
  total: number;
  paymentIntentId?: string | null;
  affiliateId?: string | null;
  trackingMethod?: string | null;
  clickId?: string | null;
}

/**
 * Database row type (snake_case from Supabase)
 */
export interface OrderDatabaseRow {
  id: string;
  user_id: string | null;
  guest_id: string | null;
  full_name: string;
  email: string;
  phone_number: string;
  shipping_address: string;
  order_notes: string | null;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  status: OrderStatus;
  subtotal: number;
  discount: number | null;
  total: number;
  payment_intent_id: string | null;
  affiliate_id: string | null;
  tracking_method: string | null;
  click_id: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * OrderItem database row
 */
export interface OrderItemDatabaseRow {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
}

/**
 * API Response type
 */
export interface OrderResponse {
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
  discount: number;
  total: number;
  paymentIntentId: string | null;
  affiliateId: string | null;
  trackingMethod: string | null;
  clickId: string | null;
  items: OrderItemResponse[];
  createdAt: string | null;
  updatedAt: string | null;
}

/**
 * OrderItem response type
 */
export interface OrderItemResponse {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  total: number;
}
