import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { buildEntitlements } from "../services/entitlements.js";

const router = Router();

// These helpers must never be available in production. The explicit env flag
// provides a second safeguard for local development.
function requireDevelopmentSubscriptionTools(req, res, next) {
  const enabled = process.env.NODE_ENV === "development"
    && process.env.ENABLE_DEV_SUBSCRIPTIONS === "true";

  if (!enabled) {
    return res.status(404).json({ error: "Ruta no encontrada." });
  }

  return next();
}

router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, accountType: true }
    });
    if (!user) return res.status(404).json({ error: "Usuario no encontrado." });

    const subscription = await prisma.subscription.findUnique({
      where: { userId: user.id }
    });

    return res.json({
      subscription: buildEntitlements(user, subscription)
    });
  } catch (error) {
    return next(error);
  }
});

// Creates or renews a 30-day fake Premium subscription for the logged-in user.
// Only available when NODE_ENV=development and ENABLE_DEV_SUBSCRIPTIONS=true.
router.post("/dev/activate", requireAuth, requireDevelopmentSubscriptionTools, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, accountType: true }
    });
    if (!user) return res.status(404).json({ error: "Usuario no encontrado." });

    const now = new Date();
    const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const plan = user.accountType === "TALENT"
      ? "TALENT_PREMIUM"
      : "INSTITUTION_PREMIUM";

    const subscription = await prisma.subscription.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        plan,
        status: "ACTIVE",
        provider: "DEVELOPMENT",
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: false
      },
      update: {
        plan,
        status: "ACTIVE",
        provider: "DEVELOPMENT",
        providerCustomerId: null,
        providerSubscriptionId: null,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: false
      }
    });

    return res.json({
      message: "Premium de prueba activado por 30 días.",
      subscription: buildEntitlements(user, subscription)
    });
  } catch (error) {
    return next(error);
  }
});

// Removes the fake subscription and returns the user to the FREE plan.
router.delete("/dev/cancel", requireAuth, requireDevelopmentSubscriptionTools, async (req, res, next) => {
  try {
    await prisma.subscription.deleteMany({
      where: { userId: req.user.id, provider: "DEVELOPMENT" }
    });

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, accountType: true }
    });
    if (!user) return res.status(404).json({ error: "Usuario no encontrado." });

    return res.json({
      message: "Premium de prueba desactivado.",
      subscription: buildEntitlements(user, null)
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
