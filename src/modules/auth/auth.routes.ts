import { Router } from 'express'
import { authRateLimiter } from '../../common/middlewares/rateLimiter'
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  googleLoginSchema,
  validate,
} from './auth.validation'
import { requireAuth, requireAdmin } from './auth.middleware'
import * as authController from './auth.controller'

const router = Router()

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new account
 *     description: Creates a new user account. May require email confirmation.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, fullName]
 *             properties:
 *               email:
 *                 type: string
 *                 example: noel@example.com
 *               password:
 *                 type: string
 *                 example: Password1
 *                 description: Minimum 8 characters, at least one uppercase letter and one number
 *               fullName:
 *                 type: string
 *                 example: Noel Deleon
 *     responses:
 *       201:
 *         description: Account created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Email already registered
 *       422:
 *         description: Validation error
 */
router.post(
  '/register',
  authRateLimiter,
  validate(registerSchema),
  authController.register
)

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login with email and password
 *     description: Authenticates a user and returns access and refresh tokens.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 example: noel@example.com
 *               password:
 *                 type: string
 *                 example: Password1
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Invalid credentials
 *       422:
 *         description: Validation error
 */
router.post(
  '/login',
  authRateLimiter,
  validate(loginSchema),
  authController.login
)

/**
 * @openapi
 * /api/auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Refresh access token
 *     description: Issues a new access and refresh token pair using a valid refresh token.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *     responses:
 *       200:
 *         description: Tokens refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Invalid or expired refresh token
 */
router.post('/refresh', authRateLimiter, authController.refresh)

/**
 * @openapi
 * /api/auth/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: Send password reset email
 *     description: Sends a password reset email if the account exists.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 example: noel@example.com
 *     responses:
 *       200:
 *         description: If the email exists, a reset link has been sent
 *       422:
 *         description: Validation error
 */
router.post(
  '/forgot-password',
  authRateLimiter,
  validate(forgotPasswordSchema),
  authController.forgotPassword
)

/**
 * @openapi
 * /api/auth/reset-password:
 *   post:
 *     tags: [Auth]
 *     summary: Reset password
 *     description: Resets user password using a valid reset token.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [password]
 *             properties:
 *               password:
 *                 type: string
 *                 example: NewPassword1
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         description: Invalid or expired reset token
 *       422:
 *         description: Validation error
 */
router.post(
  '/reset-password',
  validate(resetPasswordSchema),
  authController.resetPassword
)

/**
 * @openapi
 * /api/auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Logout current user
 *     description: Logs out the currently authenticated user session.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully
 *       401:
 *         description: Unauthorized
 */
router.post('/logout', requireAuth, authController.logout)

/**
 * @openapi
 * /api/auth/admin/logout/{userId}:
 *   post:
 *     tags: [Auth]
 *     summary: Admin logout user
 *     description: Invalidates all sessions for a specific user.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user to invalidate sessions for
 *     responses:
 *       200:
 *         description: User sessions invalidated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin only)
 */
router.post(
  '/admin/logout/:userId',
  requireAuth,
  requireAdmin,
  authController.adminLogout
)

/**
 * @openapi
 * /api/auth/google:
 *   post:
 *     tags: [Auth]
 *     summary: Google OAuth login
 *     description: Find or create user from Google OAuth and return tokens.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, fullName, googleId]
 *             properties:
 *               email:
 *                 type: string
 *                 example: noel@gmail.com
 *               fullName:
 *                 type: string
 *                 example: Noel De Leon
 *               googleId:
 *                 type: string
 *                 example: 108xxxxxxxxxxxxx
 *     responses:
 *       200:
 *         description: Google login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 */
router.post(
  '/google',
  authRateLimiter,
  validate(googleLoginSchema),
  authController.googleLogin
)

/**
 * @openapi
 * /api/auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get current user
 *     description: Returns the currently authenticated user.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User fetched successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/me', requireAuth, authController.me)
export default router