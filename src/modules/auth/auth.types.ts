/* ─────────────────────────────────────────────
   Request DTOs
───────────────────────────────────────────── */

export interface RegisterDTO {
  email: string
  password: string
  fullName: string
}

export interface LoginDTO {
  email: string
  password: string
}

export interface ForgotPasswordDTO {
  email: string
}

export interface ResetPasswordDTO {
  password: string
}

/* ─────────────────────────────────────────────
   User Payload
───────────────────────────────────────────── */

export interface AuthUser {
  id: string
  email: string
  fullName: string
  role?: 'admin' | 'user'
}

/* ─────────────────────────────────────────────
   Auth Response
───────────────────────────────────────────── */

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  user: AuthUser
}

/* ─────────────────────────────────────────────
   Generic Message Response
───────────────────────────────────────────── */

export interface MessageResponse {
  message: string
}

/* ─────────────────────────────────────────────
   Google Login DTO
───────────────────────────────────────────── */

export interface GoogleLoginDTO {
  email: string
  fullName: string
  googleId: string
}