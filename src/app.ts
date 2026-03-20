import express, { Application } from "express";
import helmet from "helmet";
import cors from "cors";
import hpp from "hpp";
import swaggerUi from "swagger-ui-express";
import cookieParser from "cookie-parser";
import { httpLogger } from "./common/middlewares/logger";
import { errorHandler } from "./common/middlewares/errorHandler";
import { generalRateLimiter } from "./common/middlewares/rateLimiter";
import { sanitizeInput } from "./common/middlewares/sanitize";
import { affiliateTrackingMiddleware } from "./common/middlewares/affiliateTracking";
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
import affiliateRoutes from "./modules/affiliates/affiliate.routes";
import affiliateSalesRoutes from "./modules/affiliates-sales/affiliate-sales.routes";
import affiliateTrackingRoutes from "./modules/affiliate-tracking/affiliate-tracking.routes";
import affiliatePixelRoutes from "./modules/affiliate-pixel/affiliate-pixel.routes";
import communityLinksRoutes from "./modules/community-links/community-links.routes";
import imageLibraryRoutes from "./modules/image-library/image-library.routes";
import coursesRoutes from "./modules/courses/courses.routes";

const app: Application = express();

// ── Security ─────────────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: env.NODE_ENV === "production" ? undefined : false,
  }),
);
app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "x-guest-id",
      "x-affiliate-cookie",
    ],
  }),
);
app.use(hpp());
app.use(sanitizeInput);
app.use(generalRateLimiter);

// ── Body Parsing ──────────────────────────────────────────────
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ── Affiliate Tracking ───────────────────────────────────────
app.use(affiliateTrackingMiddleware);

// ── Logging ───────────────────────────────────────────────────
app.use(httpLogger);

// ── Swagger UI (dev only) ─────────────────────────────────────
if (env.NODE_ENV !== "production") {
  app.use(
    "/api/docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customSiteTitle: "🌿 Triad-Ecomm API Docs",
      customCss: ".swagger-ui .topbar { background-color: #1a7a4a }",
      swaggerOptions: {
        persistAuthorization: true,
      },
    }),
  );

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
app.use("/api/affiliates", affiliateRoutes);
app.use("/api/affiliate-sales", affiliateSalesRoutes);
app.use("/api/affiliate-tracking", affiliateTrackingRoutes);
app.use("/api/affiliate-pixel", affiliatePixelRoutes);
app.use("/api/testimonials", testimonialsRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/community-links", communityLinksRoutes);
app.use("/api/courses", coursesRoutes);
app.use("/api", imageLibraryRoutes);

// ── Health Check ──────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "ok", env: env.NODE_ENV });
});

// ── Global Error Handler (must be last) ───────────────────────
app.use(errorHandler);

export default app;
