import { env } from "./config/env"; // dotenv.config() runs inside env.ts — always first
import app from "./app";

const PORT = Number(env.PORT) || 3000;

app.listen(PORT, () => {
  console.log("");
  console.log("🚀 Triad-Ecomm API running!");
  console.log("─────────────────────────────────────────");
  console.log(`🌐 Base URL     → http://localhost:${PORT}`);
  console.log(`📖 Swagger UI   → http://localhost:${PORT}/api/docs`);
  console.log(`📋 Swagger JSON → http://localhost:${PORT}/api/docs.json`);
  console.log(`🔐 Google OAuth → http://localhost:${PORT}/api/auth/google`);
  console.log(`❤️  Health       → http://localhost:${PORT}/health`);
  console.log("─────────────────────────────────────────");
  console.log(`🌍 Env          → ${env.NODE_ENV}`);
  console.log(`🖥️  Frontend     → ${env.FRONTEND_URL}`);
  console.log("");
});
