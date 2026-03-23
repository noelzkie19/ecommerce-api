/**
 * IAuthRepository Interface
 *
 * Defines the contract for authentication operations.
 * Implementation should handle Supabase Auth or similar auth provider.
 */

import { User, UserRole } from "../entities/User";

/**
 * Auth response containing tokens and user data
 */
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    role?: UserRole;
  };
  affiliateStatus?: "pending" | "active" | "suspended";
}

/**
 * User registration data
 */
export interface RegisterData {
  email: string;
  password: string;
  fullName: string;
  referralCode?: string;
}

/**
 * User login credentials
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Google login data
 */
export interface GoogleLoginData {
  email: string;
  fullName: string;
  googleId: string;
  referralCode?: string;
}

/**
 * Password reset data
 */
export interface PasswordResetData {
  email: string;
}

/**
 * New password data
 */
export interface NewPasswordData {
  accessToken: string;
  password: string;
}

/**
 * Auth user info (lightweight for dropdowns)
 */
export interface AuthUserInfo {
  id: string;
  email: string;
  name: string;
}

/**
 * Update profile data
 */
export interface UpdateProfileData {
  fullName?: string;
  avatarUrl?: string;
}

/**
 * IAuthRepository Interface
 *
 * Defines the contract for authentication operations.
 */
export interface IAuthRepository {
  /**
   * Register a new user
   */
  register(data: RegisterData): Promise<AuthResponse | { message: string }>;

  /**
   * Login with email and password
   */
  login(credentials: LoginCredentials): Promise<AuthResponse>;

  /**
   * Refresh the session tokens
   */
  refreshSession(refreshToken: string): Promise<AuthResponse>;

  /**
   * Request password reset email
   */
  forgotPassword(data: PasswordResetData): Promise<void>;

  /**
   * Reset password with new password
   */
  resetPassword(data: NewPasswordData): Promise<void>;

  /**
   * Logout current session
   */
  logout(): Promise<void>;

  /**
   * Logout user from all sessions (admin)
   */
  adminLogout(userId: string): Promise<void>;

  /**
   * Login with Google
   */
  googleLogin(data: GoogleLoginData): Promise<AuthResponse>;

  /**
   * List all auth users (admin)
   */
  listUsers(): Promise<AuthUserInfo[]>;

  /**
   * Get current user from access token
   */
  getCurrentUser(accessToken: string): Promise<User>;

  /**
   * Verify access token validity
   */
  verifyToken(accessToken: string): Promise<boolean>;

  /**
   * Find user by ID (admin)
   */
  findById(id: string): Promise<any>;

  /**
   * Update user profile
   */
  updateProfile(id: string, data: UpdateProfileData): Promise<any>;
}
