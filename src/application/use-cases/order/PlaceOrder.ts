/**
 * Place Order Use Case
 *
 * Creates a new order from the current cart.
 * For COD/card: deducts stock immediately.
 * For GCash: creates a PayMongo payment intent — stock deducted on payment confirmation.
 */

import { IOrderRepository } from "../../../domain/interfaces/IOrderRepository";
import { ICartRepository } from "../../../domain/interfaces/ICartRepository";
import { CartOwner } from "../../../domain/entities/CartItem";
import { PaymentMethod } from "../../../domain/entities/Order";
import { resolve, TOKENS } from "../../../di/container";
import { AppError } from "../../../common/utils/AppError";
import * as paymongoUtils from "../../../utils/paymongo.utils";
import { attributeOrderFromData } from "../affiliate-tracking";
import { firePurchaseEvent } from "../affiliate-pixel";
import {
  activateAffiliateByUserId,
  markAffiliateAsPaidByUserId,
} from "../../../modules/affiliates/affiliate.service";

/**
 * Input DTO for PlaceOrderUseCase
 */
export interface PlaceOrderInput {
  owner: CartOwner;
  dto: {
    fullName: string;
    email: string;
    phoneNumber: string;
    shippingAddress: string;
    orderNotes?: string;
    paymentMethod: PaymentMethod;
    discount?: number;
  };
  attributionData?: {
    affiliateId?: string;
    pixelId?: string;
    storeId?: string;
    clickId?: string;
    trackingMethod?: string;
  };
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
    paymentMethod: "cod" | "gcash" | "card";
    paymentStatus: "pending" | "paid" | "failed" | "refunded";
    status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";
    subtotal: number;
    discount: number;
    total: number;
    paymentIntentId: string | null;
    affiliateId: string | null;
    trackingMethod: string | null;
    clickId: string | null;
    items: Array<{
      id: string;
      orderId: string;
      productId: string;
      quantity: number;
      unitPrice: number;
      total: number;
      product: {
        id: string;
        name: string;
        price: number;
        imageUrl: string | null;
        primaryImageUrl: string | null;
        images: Array<{ id: string; url: string; position: number }>;
      } | null;
    }>;
    createdAt: string;
    updatedAt: string;
  };
  gcashRedirectUrl: string | null;
}

/**
 * Place Order Use Case
 */
export class PlaceOrderUseCase {
  private readonly orderRepository: IOrderRepository;
  private readonly cartRepository: ICartRepository;

  constructor(
    orderRepository?: IOrderRepository,
    cartRepository?: ICartRepository,
  ) {
    this.orderRepository =
      orderRepository ??
      resolve<IOrderRepository>(TOKENS.IOrderRepository);
    this.cartRepository =
      cartRepository ??
      resolve<ICartRepository>(TOKENS.ICartRepository);
  }

  /**
   * Execute the use case
   */
  async execute(input: PlaceOrderInput): Promise<PlaceOrderOutput> {
    const { owner, dto, attributionData } = input;

    // 1. Get cart items
    const cartItems = await this.cartRepository.findAllByOwner(owner);
    if (!cartItems.length) {
      throw new AppError("Cart is empty", 400);
    }

    const subtotal = cartItems.reduce(
      (sum, item) => sum + (item.product?.price ?? 0) * item.quantity,
      0,
    );
    const discount = dto.discount ?? 0;
    const total = subtotal - discount;

    let paymentIntentId: string | undefined;
    let gcashRedirectUrl: string | null = null;

    if (dto.paymentMethod === "gcash") {
      // GCash: create PayMongo intent — stock deducted only after payment succeeds
      const backendUrl =
        process.env.BACKEND_URL ??
        `http://localhost:${process.env.PORT ?? "3001"}`;

      const intent = await paymongoUtils.createPaymentIntent(total);
      paymentIntentId = intent.intentId;

      const { redirectUrl } = await paymongoUtils.attachMayaToIntent(
        intent.intentId,
        intent.clientKey,
        dto.email,
        dto.fullName,
        `${backendUrl}/checkout/callback?intent_id=${intent.intentId}`,
      );
      gcashRedirectUrl = redirectUrl;
    } else {
      // COD/card: deduct stock immediately
      await this.orderRepository.deductStock(
        cartItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      );

      if (owner.userId) {
        await markAffiliateAsPaidByUserId(owner.userId);
        await activateAffiliateByUserId(owner.userId);
      }
    }

    // 2. Create order
    const order = await this.orderRepository.create({
      id: crypto.randomUUID(),
      userId: owner.userId,
      guestId: owner.guestId,
      fullName: dto.fullName,
      email: dto.email,
      phoneNumber: dto.phoneNumber,
      shippingAddress: dto.shippingAddress,
      orderNotes: dto.orderNotes,
      paymentMethod: dto.paymentMethod,
      subtotal,
      discount,
      total,
      paymentIntentId,
      affiliateId: attributionData?.affiliateId,
      trackingMethod: attributionData?.trackingMethod,
      clickId: attributionData?.clickId,
    });

    // 3. Add order items
    await this.orderRepository.addItems(
      order.id,
      cartItems.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.product?.price ?? 0,
      })),
    );

    // 4. Attribute order if affiliate is present
    if (attributionData?.affiliateId) {
      try {
        await attributeOrderFromData({
          orderId: order.id,
          affiliateId: attributionData.affiliateId,
          pixelId: attributionData.pixelId,
          storeId: attributionData.storeId,
          clickId: attributionData.clickId,
          trackingMethod: (attributionData.trackingMethod as any) ?? "url_param",
        });
      } catch {
        // Silent fail — attribution failure should not block order
      }
    }

    // 5. Clear cart
    await this.cartRepository.clearCart(owner);

    // 6. Fetch full order with items for response
    const fullOrder = await this.orderRepository.findById(order.id);
    if (!fullOrder) throw new AppError("Failed to retrieve order", 500);

    return {
      order: fullOrder.toResponse(),
      gcashRedirectUrl,
    };
  }
}
