/* ─────────────────────────────────────────────
   Request DTOs
───────────────────────────────────────────── */

export interface RegisterDTO {
  email: string;
  password: string;
  fullName: string;
  /** Optional referral code from ?ref= query param */
  referralCode?: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface ForgotPasswordDTO {
  email: string;
}

export interface ResetPasswordDTO {
  password: string;
}

/* ─────────────────────────────────────────────
   User Payload
───────────────────────────────────────────── */

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role?: "admin" | "user";
}

/* ─────────────────────────────────────────────
   Auth Response
───────────────────────────────────────────── */

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
  /** Affiliate status returned after login/register so frontend can redirect correctly */
  affiliateStatus?: "pending" | "active" | "suspended";
}

/* ─────────────────────────────────────────────
   Generic Message Response
───────────────────────────────────────────── */

export interface MessageResponse {
  message: string;
}

/* ─────────────────────────────────────────────
   Google Login DTO
───────────────────────────────────────────── */

export interface GoogleLoginDTO {
  email: string;
  fullName: string;
  googleId: string;
  /** Optional referral code from ?ref= query param */
  referralCode?: string;
}
