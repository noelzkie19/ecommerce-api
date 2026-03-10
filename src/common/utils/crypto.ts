import { env } from '../../config/env'

/**
 * Password security layers:
 *
 * 1. PEPPER  — secret server-side string combined with password using HMAC
 *              Even if DB is leaked, attacker needs the pepper to crack hashes
 *              Deterministic — same input always gives same output (required for login)
 *
 * 2. SUPABASE — bcrypts the peppered password with salt (12 rounds)
 *               Never stores plain text — handles all hashing internally
 *
 * WHY NOT bcrypt here too?
 * Supabase compares the raw value we send against what it stored.
 * If we bcrypt before sending, the stored hash would be bcrypt(bcrypt(peppered))
 * but login would send bcrypt(peppered) — they'd never match.
 * Supabase owns the hashing layer — we own the pepper layer.
 *
 * Flow: plainPassword → HMAC-SHA256(pepper) → sent to Supabase → Supabase bcrypts → stored
 */

import { createHmac } from 'node:crypto'

export const pepperPassword = (plainPassword: string): string => {
  return createHmac('sha256', env.PASSWORD_PEPPER)
    .update(plainPassword)
    .digest('hex')
}