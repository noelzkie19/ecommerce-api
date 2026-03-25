/**
 * Place Order Use Case
 *
 * Creates a new order from the user's cart.
 * For GCash payments, creates a payment intent with PayMongo.
 * For COD, creates the order directly.
 */

import { IOrderRepository } from "../../../domain/interfaces/IOrderRepository";
import {
  ICartRepository,
  CartOwner,
} from "../../../domain/interfaces/ICartRepository";
import { IStockRepository } from "../../../domain/interfaces/IStockRepository";
import {
  CreateOrderProps,
  PaymentMethod,
} from "../../../domain/entities/Order";
import { resolve, TOKENS } from "../../../di/container";
import { env } from "../../../config/env";
import { AppError } from "../../../common/utils/AppError";
import * as paymongoUtils from "../../../utils/paymongo.utils";

/**
 * Input DTO for PlaceOrderUseCase
 */
export interface PlaceOrderInput {
  userId?: string;
  guestId?: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  shippingAddress: string;
  paymentMethod: PaymentMethod;
  orderNotes?: string;
  discount?: number;
  affiliateId?: string;
  clickId?: string;
  trackingMethod?: string;
}

/**
 * Output DTO for PlaceOrderUseCase
 */
export interface PlaceOrderOutput {
  order: {
    id: string;
    userId: string | null;
    guestId: string | null;
    fullName: string;
    email: string;
    phoneNumber: string;
    shippingAddress: string;
    orderNotes: string | null;
    paymentMethod: string;
    paymentStatus: string;
    status: string;
    subtotal: number;
    discount: number;
    total: number;
    paymentIntentId: string | null;
    affiliateId: string | null;
    trackingMethod: string | null;
    clickId: string | null;
    createdAt: string | null;
    updatedAt: string | null;
  } | null;
  mayaRedirectUrl: string | null;
}

/**
 * Place Order Use Case
 */
export class PlaceOrderUseCase {
  private readonly orderRepository: IOrderRepository;
  private readonly cartRepository: ICartRepository;
  private readonly stockRepository: IStockRepository;

  constructor(
    orderRepository?: IOrderRepository,
    cartRepository?: ICartRepository,
    stockRepository?: IStockRepository,
  ) {
    this.orderRepository =
      orderRepository ?? resolve<IOrderRepository>(TOKENS.IOrderRepository);
    this.cartRepository =
      cartRepository ?? resolve<ICartRepository>(TOKENS.ICartRepository);
    this.stockRepository =
      stockRepository ?? resolve<IStockRepository>(TOKENS.IStockRepository);
  }

  /**
   * Execute the use case
   */
  async execute(input: PlaceOrderInput): Promise<PlaceOrderOutput> {
    // 1. Get the cart owner
    const owner = this.getCartOwner(input);

    // 2. Get cart items and validate
    const cartItems = await this.getAndValidateCart(owner);

    // 3. Calculate order totals (includes shipping fee in total)
    const { subtotal, orderItems, discount, total } = this.calculateOrderTotals(
      cartItems,
      input,
    );

    // 4. Validate stock availability for all items BEFORE creating order or payment
    await this.validateStock(orderItems);

    // 5. Generate order ID (needed for payment intent metadata)
    const orderId = crypto.randomUUID();

    // 6. Handle payment for GCash/card - create payment intent first
    const { mayaRedirectUrl, paymentIntentId } = await this.handlePaymentMethod(
      input,
      total,
      orderId,
    );

    // 6. Create the order with payment intent ID (if any)
    const createOrderProps: CreateOrderProps = this.buildCreateOrderProps(
      input,
      orderId,
      subtotal,
      discount,
      total,
      paymentIntentId,
    );

    const order = await this.orderRepository.create(createOrderProps);

    // 8. Add order items
    await this.orderRepository.addItems(
      orderId,
      orderItems.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
    );

    // 9. Clear the cart after successful order
    await this.cartRepository.clearCart(owner);

    // 10. Deduct stock for each product in the order
    await this.deductStock(orderItems);

    // 10. Return the result
    return {
      order: this.formatOrderResponse(order),
      mayaRedirectUrl,
    };
  }

  /**
   * Get cart owner from input
   */
  private getCartOwner(input: PlaceOrderInput): CartOwner {
    const owner: CartOwner = {};
    if (input.userId) {
      owner.userId = input.userId;
    } else if (input.guestId) {
      owner.guestId = input.guestId;
    } else {
      throw new Error("Either userId or guestId is required");
    }
    return owner;
  }

  /**
   * Get cart items and validate
   */
  private async getAndValidateCart(
    owner: CartOwner,
  ): Promise<
    NonNullable<Awaited<ReturnType<ICartRepository["findAllByOwner"]>>>
  > {
    const cartItems = await this.cartRepository.findAllByOwner(owner);

    if (!cartItems || cartItems.length === 0) {
      throw new Error("Cart is empty");
    }

    return cartItems;
  }

  /**
   * Calculate shipping fee based on subtotal.
   * Free shipping for orders >= ₱999, otherwise ₱150.
   */
  private calculateShipping(subtotal: number): number {
    return subtotal >= 999 ? 0 : 150;
  }

  /**
   * Calculate order totals from cart items
   */
  private calculateOrderTotals(
    cartItems: NonNullable<
      Awaited<ReturnType<ICartRepository["findAllByOwner"]>>
    >,
    input: PlaceOrderInput,
  ): {
    subtotal: number;
    shipping: number;
    orderItems: { productId: string; quantity: number; unitPrice: number }[];
    discount: number;
    total: number;
  } {
    let subtotal = 0;
    const orderItems: {
      productId: string;
      quantity: number;
      unitPrice: number;
    }[] = [];

    for (const item of cartItems) {
      if (!item.product) {
        throw new Error(`Product not found for cart item ${item.id}`);
      }
      const itemTotal = item.product.price * item.quantity;
      subtotal += itemTotal;
      orderItems.push({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.product.price,
      });
    }

    const discount = input.discount ?? 0;
    const shipping = this.calculateShipping(subtotal);
    const total = subtotal + shipping - discount;

    if (total <= 0) {
      throw new Error("Order total must be greater than 0");
    }

    return { subtotal, shipping, orderItems, discount, total };
  }

  /**
   * Handle payment method and create payment intent if needed
   */
  private async handlePaymentMethod(
    input: PlaceOrderInput,
    total: number,
    orderId: string,
  ): Promise<{
    mayaRedirectUrl: string | null;
    paymentIntentId: string | null;
  }> {
    let mayaRedirectUrl: string | null = null;
    let paymentIntentId: string | null = null;

    if (input.paymentMethod === "maya") {
      const backendUrl = env.BACKEND_URL || "http://localhost:3001";
      const returnUrl = `${backendUrl}/api/orders/verify-gcash`;

      const intent = await paymongoUtils.createPaymentIntent(total, {
        order_id: orderId,
        user_id: input.userId ?? input.guestId ?? "",
        guest_id: input.guestId ?? "",
      });

      paymentIntentId = intent.intentId;

      const { redirectUrl } = await paymongoUtils.attachMayaToIntent(
        intent.intentId,
        intent.clientKey,
        input.email,
        input.fullName,
        returnUrl,
      );

      mayaRedirectUrl = redirectUrl;
    }

    return { mayaRedirectUrl, paymentIntentId };
  }

  /**
   * Build create order props
   */
  private buildCreateOrderProps(
    input: PlaceOrderInput,
    orderId: string,
    subtotal: number,
    discount: number,
    total: number,
    paymentIntentId: string | null,
  ): CreateOrderProps {
    return {
      id: orderId,
      userId: input.userId ?? null,
      guestId: input.guestId ?? null,
      fullName: input.fullName,
      email: input.email,
      phoneNumber: input.phoneNumber,
      shippingAddress: input.shippingAddress,
      orderNotes: input.orderNotes ?? null,
      paymentMethod: input.paymentMethod,
      subtotal,
      discount,
      total,
      paymentIntentId,
      affiliateId: input.affiliateId ?? null,
      trackingMethod: input.trackingMethod ?? null,
      clickId: input.clickId ?? null,
    };
  }

  /**
   * Validate stock availability for all order items before creating the order.
   * Throws an AppError listing all products with insufficient stock.
   */
  private async validateStock(
    orderItems: { productId: string; quantity: number; unitPrice: number }[],
  ): Promise<void> {
    const insufficientItems: string[] = [];

    for (const item of orderItems) {
      const stock = await this.stockRepository.findByProductId(item.productId);
      const available = stock?.quantity ?? 0;
      if (available < item.quantity) {
        insufficientItems.push(
          `Product ${item.productId}: requested ${item.quantity}, only ${available} available`,
        );
      }
    }

    if (insufficientItems.length > 0) {
      throw new AppError(
        `Insufficient stock for the following items: ${insufficientItems.join("; ")}`,
        400,
      );
    }
  }

  /**
   * Deduct stock for each product in the order.
   * Stock has already been validated before this point.
   */
  private async deductStock(
    orderItems: { productId: string; quantity: number; unitPrice: number }[],
  ): Promise<void> {
    for (const item of orderItems) {
      const currentStock = await this.stockRepository.findByProductId(
        item.productId,
      );
      const newQuantity = Math.max(
        0,
        (currentStock?.quantity ?? 0) - item.quantity,
      );
      await this.stockRepository.upsert(item.productId, {
        quantity: newQuantity,
      });
    }
  }

  /**
   * Format order response
   */
  private formatOrderResponse(
    order: Awaited<ReturnType<IOrderRepository["create"]>>,
  ) {
    return {
      id: order.id,
      userId: order.userId,
      guestId: order.guestId,
      fullName: order.fullName,
      email: order.email,
      phoneNumber: order.phoneNumber,
      shippingAddress: order.shippingAddress,
      orderNotes: order.orderNotes,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      status: order.status,
      subtotal: order.subtotal,
      discount: order.discount,
      total: order.total,
      paymentIntentId: order.paymentIntentId,
      affiliateId: order.affiliateId,
      trackingMethod: order.trackingMethod,
      clickId: order.clickId,
      createdAt:
        order.createdAt && !Number.isNaN(order.createdAt.getTime())
          ? order.createdAt.toISOString()
          : null,
      updatedAt:
        order.updatedAt && !Number.isNaN(order.updatedAt.getTime())
          ? order.updatedAt.toISOString()
          : null,
    };
  }
}
