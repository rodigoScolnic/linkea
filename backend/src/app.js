import express from "express";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import authRoutes from "./routes/auth.routes.js";
import profileRoutes from "./routes/profile.routes.js";
import discoveryRoutes from "./routes/discovery.routes.js";
import likesRoutes from "./routes/likes.routes.js";
import matchesRoutes from "./routes/matches.routes.js";
import conversationsRoutes from "./routes/conversations.routes.js";
import favoritesRoutes from "./routes/favorites.routes.js";
import invitationsRoutes from "./routes/invitations.routes.js";
import opportunitiesRoutes from "./routes/opportunities.routes.js";
import notificationsRoutes from "./routes/notifications.routes.js";
import subscriptionRoutes from "./routes/subscription.routes.js";
import { errorHandler, notFound } from "./middleware/errors.js";
const app = express();
app.use(helmet());
const allowedOrigins = [...new Set([
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  ...(process.env.FRONTEND_URL || "").split(",").map((origin) => origin.trim()).filter(Boolean)
])];
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use("/api/auth", rateLimit({ windowMs: 15 * 60 * 1000, limit: 30 }));
app.get("/api/health", (req, res) => res.json({ status: "ok", service: "Linkea API" }));
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/discover", discoveryRoutes);
app.use("/api/likes", likesRoutes);
app.use("/api/matches", matchesRoutes);
app.use("/api/conversations", conversationsRoutes);
app.use("/api/favorites", favoritesRoutes);
app.use("/api/invitations", invitationsRoutes);
app.use("/api/opportunities", opportunitiesRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/subscription", subscriptionRoutes);
app.use(notFound);
app.use(errorHandler);
export default app;