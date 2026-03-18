/**
 * User Entity
 *
 * Represents a user in the e-commerce platform.
 * This is a core domain entity that contains pure business logic.
 */

export type UserRole = "admin" | "user";

/**
 * User entity with business logic
 */
export class User {
  readonly id: string;
  readonly email: string;
  readonly fullName: string;
  readonly role: UserRole;
  readonly createdAt: Date;
  private _affiliateId: string | null = null;

  private constructor(props: UserProps) {
    this.id = props.id;
    this.email = props.email;
    this.fullName = props.fullName;
    this.role = props.role;
    this.createdAt = props.createdAt;
  }

  /**
   * Factory method to create a new User
   */
  static create(props: CreateUserProps): User {
    return new User({
      id: props.id,
      email: props.email,
      fullName: props.fullName,
      role: props.role ?? "user",
      createdAt: props.createdAt ?? new Date(),
    });
  }

  /**
   * Create User from Supabase auth user
   */
  static fromAuthUser(authUser: AuthUserData): User {
    return new User({
      id: authUser.id,
      email: authUser.email,
      fullName: authUser.fullName ?? authUser.email.split("@")[0],
      role: authUser.role ?? "user",
      createdAt: new Date(), // Auth users don't have created_at in the same way
    });
  }

  /**
   * Set affiliate ID
   */
  setAffiliateId(affiliateId: string): void {
    this._affiliateId = affiliateId;
  }

  /**
   * Check if user has affiliate account
   */
  hasAffiliateAccount(): boolean {
    return this._affiliateId !== null;
  }

  /**
   * Get affiliate ID
   */
  getAffiliateId(): string | null {
    return this._affiliateId;
  }

  /**
   * Check if user is admin
   */
  isAdmin(): boolean {
    return this.role === "admin";
  }

  /**
   * Check if user is regular user
   */
  isRegularUser(): boolean {
    return this.role === "user";
  }

  /**
   * Update user's full name
   */
  updateFullName(fullName: string): User {
    return new User({
      ...this.toProps(),
      fullName,
    });
  }

  /**
   * Convert to plain object for response
   */
  toResponse(): UserResponse {
    return {
      id: this.id,
      email: this.email,
      fullName: this.fullName,
      role: this.role,
      affiliateId: this._affiliateId,
      createdAt: this.createdAt.toISOString(),
    };
  }

  private toProps(): UserProps {
    return {
      id: this.id,
      email: this.email,
      fullName: this.fullName,
      role: this.role,
      createdAt: this.createdAt,
    };
  }
}

/**
 * User properties (internal)
 */
interface UserProps {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  createdAt: Date;
}

/**
 * Properties for creating a new User
 */
export interface CreateUserProps {
  id: string;
  email: string;
  fullName: string;
  role?: UserRole;
  createdAt?: Date;
}

/**
 * Data from Supabase Auth
 */
export interface AuthUserData {
  id: string;
  email: string;
  fullName?: string;
  role?: UserRole;
}

/**
 * API Response type
 */
export interface UserResponse {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  affiliateId: string | null;
  createdAt: string;
}
