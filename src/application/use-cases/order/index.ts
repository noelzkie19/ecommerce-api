/**
 * Order Use Cases Index
 *
 * Exports all order-related use cases.
 */

export {
  PlaceOrderUseCase,
  type PlaceOrderInput,
  type PlaceOrderOutput,
} from "./PlaceOrder";
export {
  VerifyGCashPaymentUseCase,
  type VerifyGCashPaymentInput,
  type VerifyGCashPaymentOutput,
} from "./VerifyGCashPayment";
export {
  ProcessPaymentWebhookUseCase,
  type ProcessPaymentWebhookInput,
  type ProcessPaymentWebhookOutput,
} from "./ProcessPaymentWebhook";
export {
  GetOrderUseCase,
  type GetOrderInput,
  type GetOrderOutput,
} from "./GetOrder";
export {
  ListOrdersUseCase,
  type ListOrdersInput,
  type ListOrdersOutput,
} from "./ListOrders";
export {
  GetAllOrdersUseCase,
  type GetAllOrdersInput,
  type GetAllOrdersOutput,
} from "./GetAllOrders";
export {
  GetOrderAdminUseCase,
  type GetOrderAdminInput,
  type GetOrderAdminOutput,
} from "./GetOrderAdmin";
export {
  UpdateOrderStatusUseCase,
  type UpdateOrderStatusInput,
  type UpdateOrderStatusOutput,
} from "./UpdateOrderStatus";
export {
  MarkCodOrderPaidUseCase,
  type MarkCodOrderPaidInput,
  type MarkCodOrderPaidOutput,
} from "./MarkCodOrderPaid";
