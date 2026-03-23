/**
 * Domain Interfaces Index
 *
 * Re-exports all interfaces for convenient importing.
 */

export type { IAffiliateRepository } from "./IAffiliateRepository";
export type { IAffiliatePixelRepository } from "./IAffiliatePixelRepository";
export type { IAffiliateTrackingRepository } from "./IAffiliateTrackingRepository";
export type {
  IAuthRepository,
  AuthResponse,
  RegisterData,
  LoginCredentials,
  GoogleLoginData,
  PasswordResetData,
  NewPasswordData,
  AuthUserInfo,
} from "./IAuthRepository";
export type {
  IOrderRepository,
  StockDeductionItem,
  CreateOrderItem,
} from "./IOrderRepository";
export type { IProductRepository } from "./IProductRepository";
export type { IStockRepository } from "./IStockRepository";
export type { ITestimonialRepository } from "./ITestimonialRepository";
export type { IWishlistRepository } from "./IWishlistRepository";
export type { ICourseRepository } from "./ICourseRepository";
export type {
  ICommunityLinkRepository,
  CommunityLinkFilters,
  PaginatedCommunityLinks,
} from "./ICommunityLinkRepository";
export type {
  IImageLibraryRepository,
  ImageLibraryFilters,
  PaginatedImageLibraries,
} from "./IImageLibraryRepository";
export type {
  PaginatedResult,
  AffiliateProduct,
  AffiliateSettings,
} from "./IAffiliateRepository";
export type {
  CreatePixelEventInput,
  FailedPixelEvent,
  PixelEventStats,
} from "./IAffiliatePixelRepository";
export type {
  TrackingLinkWithAffiliate,
  AttributionRecord,
  TrackingStats,
  PaginatedTrackingLinks,
  PaginatedAttributions,
} from "./IAffiliateTrackingRepository";
