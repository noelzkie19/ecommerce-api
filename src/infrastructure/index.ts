/**
 * Infrastructure Layer Index
 *
 * This is where we implement the interfaces defined in the domain layer.
 * The infrastructure layer contains:
 * - Database repository implementations (Supabase, Prisma, etc.)
 * - External service integrations (Payment gateways, Email services, etc.)
 */

// Database repositories
export {
  SupabaseAffiliateRepository,
  affiliateRepository,
} from "./database/supabase/SupabaseAffiliateRepository";

export {
  SupabaseProductRepository,
  productRepository,
} from "./database/supabase/SupabaseProductRepository";

export {
  SupabaseCourseRepository,
  courseRepository,
} from "./database/supabase/SupabaseCourseRepository";

export { SupabaseCommunityLinkRepository } from "./database/supabase/SupabaseCommunityLinkRepository";

export {
  SupabaseImageLibraryRepository,
  imageLibraryRepository,
} from "./database/supabase/SupabaseImageLibraryRepository";

export { SupabaseStockRepository } from "./database/supabase/SupabaseStockRepository";
export { SupabaseTestimonialRepository } from "./database/supabase/SupabaseTestimonialRepository";
