/**
 * Domain Interfaces Index
 *
 * Re-exports all interfaces for convenient importing.
 */

export type { IAffiliateRepository } from "./IAffiliateRepository";
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
export type { IStockRepository } from "./IStockRepository";
export type {
  ITestimonialRepository,
  PaginatedTestimonials,
} from "./ITestimonialRepository";
export type { ICartRepository } from "./ICartRepository";
