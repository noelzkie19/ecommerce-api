/**
 * Affiliate Sales Use Cases Index
 */

// Shared Types
export type AffiliateSaleStatus = "pending" | "approved" | "rejected";
export type CommissionType = "percentage" | "fixed";

// Affiliate Sale
export interface AffiliateSale {
  id: string;
  affiliateId: string;
  orderId: string;
  orderItemId: string;
  productId: string;
  quantity: number;
  saleAmount: number;
  commissionType: CommissionType;
  commissionValue: number;
  commissionEarned: number;
  status: AffiliateSaleStatus;
  createdAt: string;
  updatedAt: string;
  affiliate?: { id: string; name: string; email: string };
  product?: {
    id: string;
    name: string;
    price: number;
    image_url: string | null;
  };
  order?: { id: string; status: string; created_at: string };
}

// Pagination
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedAffiliateSales<T = AffiliateSale> {
  data: T[];
  meta: PaginationMeta;
}

// DTOs
export interface UpdateAffiliateSaleStatusDTO {
  status: AffiliateSaleStatus;
}

export {
  ListAffiliateSalesUseCase,
  type ListAffiliateSalesInput,
  type ListAffiliateSalesOutput,
} from "./ListAffiliateSales";

export {
  GetAffiliateSaleUseCase,
  type GetAffiliateSaleInput,
  type GetAffiliateSaleOutput,
} from "./GetAffiliateSale";

export {
  UpdateAffiliateSaleStatusUseCase,
  type UpdateAffiliateSaleStatusInput,
  type UpdateAffiliateSaleStatusOutput,
} from "./UpdateAffiliateSaleStatus";

export {
  ApproveAffiliateSaleUseCase,
  type ApproveAffiliateSaleInput,
  type ApproveAffiliateSaleOutput,
} from "./ApproveAffiliateSale";

export {
  RejectAffiliateSaleUseCase,
  type RejectAffiliateSaleInput,
  type RejectAffiliateSaleOutput,
} from "./RejectAffiliateSale";

export {
  DeleteAffiliateSaleUseCase,
  type DeleteAffiliateSaleInput,
} from "./DeleteAffiliateSale";
