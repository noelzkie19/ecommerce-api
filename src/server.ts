import { env } from "./config/env"; // dotenv.config() runs inside env.ts — always first
import app from "./app";

const PORT = Number(env.PORT) || 3000;

const BASE_URL = env.BACKEND_URL || `http://localhost:${PORT}`;

app.listen(PORT, () => {
  console.log("");
  console.log("🚀 Triad-Ecomm API running!");
  console.log("─────────────────────────────────────────");
  console.log(`🌐 Base URL     → ${BASE_URL}`);
  console.log(`📖 Swagger UI   → ${BASE_URL}/api/docs`);
  console.log(`📋 Swagger JSON → ${BASE_URL}/api/docs.json`);
  console.log(`🔐 Google OAuth → ${BASE_URL}/api/auth/google`);
  console.log(`❤️  Health       → ${BASE_URL}/health`);
  console.log("─────────────────────────────────────────");
  console.log(`🌍 Env          → ${env.NODE_ENV}`);
  console.log(`🖥️  Frontend     → ${env.FRONTEND_URL}`);
  console.log("");
});
