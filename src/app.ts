import express, { Application } from "express";
import helmet from "helmet";
import cors from "cors";
import hpp from "hpp";
import swaggerUi from "swagger-ui-express";
import { httpLogger } from "./common/middlewares/logger";
import { errorHandler } from "./common/middlewares/errorHandler";
import { generalRateLimiter } from "./common/middlewares/rateLimiter";
import { sanitizeInput } from "./common/middlewares/sanitize";
import { env } from "./config/env";

// Routes
import authRoutes from "./modules/auth/auth.routes";
import usersRoutes from "./modules/users/users.routes";
import productsRoutes from "./modules/products/products.routes";
import cartRoutes from "./modules/cart/cart.routes";
import wishlistRoutes from "./modules/wishlist/wishlist.routes";
import { swaggerSpec } from "./config/swagger";
import stocksRoutes from "./modules/stocks/stocks.routes";
import testimonialsRoutes from "./modules/testimonials/testimonials.routes";
import orderRoutes from "./modules/order/order.routes";

const app: Application = express();

// ── Security ─────────────────────────────────────────────────
app.use(
  helmet({
    // Allow Swagger UI to load its assets
    contentSecurityPolicy: env.NODE_ENV === "production" ? undefined : false,
  }),
);
app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-guest-id"],
  }),
);
app.use(hpp());
app.use(sanitizeInput);
app.use(generalRateLimiter);

// ── Body Parsing ──────────────────────────────────────────────
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));

// ── Logging ───────────────────────────────────────────────────
app.use(httpLogger);

// ── Swagger UI (dev only) ─────────────────────────────────────
if (env.NODE_ENV !== "production") {
  app.use(
    "/api/docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customSiteTitle: "🌿 NanuHealth API Docs",
      customCss: ".swagger-ui .topbar { background-color: #1a7a4a }",
      swaggerOptions: {
        persistAuthorization: true,
      },
    }),
  );

  // Raw JSON spec endpoint — useful for importing into Postman
  app.get("/api/docs.json", (_req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
  });
}

// ── Routes ────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/stocks", stocksRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/testimonials", testimonialsRoutes);
app.use("/api/wishlist", wishlistRoutes);

// ── Health Check ──────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "ok", env: env.NODE_ENV });
});

// ── Global Error Handler (must be last) ───────────────────────
app.use(errorHandler);

export default app;
