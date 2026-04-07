import path from "node:path";
import dotenv from "dotenv";
import { z } from "zod";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const envSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  PASSWORD_PEPPER: z.string().min(16, "Pepper must be at least 16 characters"),
  PORT: z.string().default("3000"),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  FRONTEND_URL: z.string().url(),
  BACKEND_URL: z.string().url(),
  AFFILIATE_REGISTRATION_FEE: z.string().default("999"),
  META_PIXEL_ID: z.string().optional(),
  META_ACCESS_TOKEN: z.string().optional(),
  PAYMONGO_SECRET_KEY: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default("Triad365 <noreply@triad365.com>"),
  EMAIL_REPLY_TO: z.string().default("support@triad365.com"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
