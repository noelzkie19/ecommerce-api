export type AffiliateSaleStatus = "pending" | "approved" | "rejected";
export type CommissionType = "percentage" | "fixed";

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
  /** Joined */
  affiliate?: { id: string; name: string; email: string };
  product?: {
    id: string;
    name: string;
    price: number;
    image_url: string | null;
  };
  order?: { id: string; status: string; created_at: string };
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedAffiliateSales {
  data: AffiliateSale[];
  meta: PaginationMeta;
}

export interface UpdateAffiliateSaleStatusDTO {
  status: AffiliateSaleStatus;
}
