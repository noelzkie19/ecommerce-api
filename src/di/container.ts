/**
 * Dependency Injection Container
 *
 * A simple DI container for managing dependencies across the application.
 * This follows the dependency inversion principle - high-level modules
 * depend on abstractions (interfaces) not concrete implementations.
 */

import { SupabaseAffiliateRepository } from "../infrastructure/database/supabase/SupabaseAffiliateRepository";
import { SupabaseProductRepository } from "../infrastructure/database/supabase/SupabaseProductRepository";
import { SupabaseCourseRepository } from "../infrastructure/database/supabase/SupabaseCourseRepository";
import { SupabaseAuthRepository } from "../infrastructure/database/supabase/SupabaseAuthRepository";
import { SupabaseCommunityLinkRepository } from "../infrastructure/database/supabase/SupabaseCommunityLinkRepository";
import { SupabaseImageLibraryRepository } from "../infrastructure/database/supabase/SupabaseImageLibraryRepository";

/**
 * Dependency Container
 *
 * Holds all application dependencies. In production, this could be
 * replaced with a more sophisticated DI library like tsyringe or inversify.
 */
class Container {
  private static instance: Container;
  private readonly dependencies: Map<string, any> = new Map();

  private constructor() {
    // Register default implementations
    this.registerDefaultDependencies();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): Container {
    if (!Container.instance) {
      Container.instance = new Container();
    }
    return Container.instance;
  }

  /**
   * Register default dependencies
   */
  private registerDefaultDependencies(): void {
    // Register repository implementations
    this.dependencies.set(
      "IAffiliateRepository",
      new SupabaseAffiliateRepository(),
    );
    this.dependencies.set(
      "IProductRepository",
      new SupabaseProductRepository(),
    );
    this.dependencies.set("ICourseRepository", new SupabaseCourseRepository());
    this.dependencies.set("IAuthRepository", new SupabaseAuthRepository());
    this.dependencies.set(
      "ICommunityLinkRepository",
      new SupabaseCommunityLinkRepository(),
    );
    this.dependencies.set(
      "IImageLibraryRepository",
      new SupabaseImageLibraryRepository(),
    );
  }

  /**
   * Register a dependency
   */
  register<T>(token: string, implementation: T): void {
    this.dependencies.set(token, implementation);
  }

  /**
   * Resolve a dependency
   */
  resolve<T>(token: string): T {
    const dependency = this.dependencies.get(token);
    if (!dependency) {
      throw new Error(`Dependency not found: ${token}`);
    }
    return dependency as T;
  }

  /**
   * Check if dependency is registered
   */
  has(token: string): boolean {
    return this.dependencies.has(token);
  }
}

// Export convenience functions
export const container = Container.getInstance();

/**
 * Resolve a dependency (shortcut)
 */
export function resolve<T>(token: string): T {
  return container.resolve<T>(token);
}

/**
 * Register a dependency (shortcut)
 */
export function register<T>(token: string, implementation: T): void {
  container.register(token, implementation);
}

// Export tokens for type-safe dependency resolution
export const TOKENS = {
  IAffiliateRepository: "IAffiliateRepository",
  IOrderRepository: "IOrderRepository",
  IProductRepository: "IProductRepository",
  ICourseRepository: "ICourseRepository",
  IAuthRepository: "IAuthRepository",
  ICommunityLinkRepository: "ICommunityLinkRepository",
  IImageLibraryRepository: "IImageLibraryRepository",
} as const;
