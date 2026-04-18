/**
 * Domain Entities Index
 *
 * Re-exports all domain entities for convenient importing.
 */

// Affiliate exports
export {
  Affiliate,
  type AffiliateStatus,
  type PaymentStatus as AffiliatePaymentStatus,
  type CreateAffiliateProps,
  type AffiliateDatabaseRow,
  type AffiliateResponse,
} from "./Affiliate";

// Order exports
export {
  Order,
  OrderItem,
  type OrderStatus,
  type PaymentStatus as OrderPaymentStatus,
  type PaymentMethod,
  type CreateOrderProps,
  type OrderDatabaseRow,
  type OrderItemDatabaseRow,
  type OrderResponse,
  type OrderItemResponse,
} from "./Order";

// User exports
export {
  User,
  type UserRole,
  type CreateUserProps,
  type AuthUserData,
  type UserResponse,
} from "./User";

// Product exports
export {
  Product,
  ProductImage,
  ProductBundle,
  type ProductStatus,
  type CreateProductProps,
  type UpdateProductProps,
  type ProductFilters,
  type ProductDatabaseRow,
  type ProductImageDatabaseRow,
  type ProductBundleDatabaseRow,
  type ProductResponse,
  type ProductImageResponse,
  type ProductBundleResponse,
  type CreateProductBundleProps,
  type UpdateProductBundleProps,
} from "./Product";

// Course exports
export {
  Course,
  YouTubeVideo,
  type ThumbnailQuality,
  type CreateCourseProps,
  type UpdateCourseProps,
  type CourseFilters,
  type CourseDatabaseRow,
  type CourseResponse,
  type extractVideoId,
  type isValidYouTubeUrl,
} from "./Course";

// Community Link exports
export {
  CommunityLink,
  type CommunityLinkCategory,
  type CommunityLinkProps,
  type CreateCommunityLinkProps,
  type UpdateCommunityLinkProps,
  type CommunityLinkDB,
  type CommunityLinkResponse,
  type CommunityLinkPublicResponse,
} from "./CommunityLink";

// Image Library exports
export {
  ImageLibrary,
  type ImageLibraryCategory,
  type ImageLibraryProps,
  type CreateImageLibraryProps,
  type UpdateImageLibraryProps,
  type ImageLibraryDB,
  type ImageLibraryResponse,
  type ImageLibraryPublicResponse,
} from "./ImageLibrary";
