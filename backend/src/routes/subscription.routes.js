import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { buildEntitlements } from "../services/entitlements.js";

const router = Router();

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

export default router;
