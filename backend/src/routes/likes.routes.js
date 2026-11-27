import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { getUserEntitlements } from "../services/user-entitlements.js";
import { buildEntitlements } from "../services/entitlements.js";

const router = Router();

function argentinaDayStart(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  // Argentina is UTC-3; this creates midnight in Argentina as a UTC instant.
  return new Date(`${values.year}-${values.month}-${values.day}T03:00:00.000Z`);
}

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const likes = await prisma.like.findMany({
      where: { fromUserId: req.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        toUser: {
          select: {
            id: true,
            username: true,
            profile: {
              select: {
                displayName: true,
                photoUrl: true,
                city: true,
                vocalRegister: true
              }
            }
          }
        }
      }
    });
    res.json({ likes });
  } catch (error) { next(error); }
});

// Received likes are a Talent Premium feature.
router.get("/received", requireAuth, async (req, res, next) => {
  try {
    const result = await getUserEntitlements(req.user.id);
    if (!result) return res.status(404).json({ error: "Usuario no encontrado." });
    if (result.user.accountType !== "TALENT") {
      return res.status(403).json({ error: "Esta sección es exclusiva para talentos." });
    }
    if (!result.entitlements.limits.canSeeReceivedLikes) {
      return res.status(403).json({
        code: "PREMIUM_REQUIRED",
        feature: "received_likes",
        error: "Ver quién te dio Me gusta es una función de Linkea Premium."
      });
    }

    const likes = await prisma.like.findMany({
      where: { toUserId: req.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        fromUser: {
          select: {
            id: true,
            username: true,
            accountType: true,
            profile: { select: { displayName: true, photoUrl: true, city: true, vocalRegister: true } },
            institutionProfile: { select: { name: true, logoUrl: true, type: true, city: true } }
          }
        }
      }
    });
    return res.json({ likes });
  } catch (error) { return next(error); }
});

router.post("/:userId", requireAuth, async (req, res, next) => {
  try {
    const userId = req.params.userId;
    if (userId === req.user.id) return res.status(400).json({ error: "No podés darte like a vos mismo." });

    const target = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!target) return res.status(404).json({ error: "Usuario no encontrado." });

    const result = await prisma.$transaction(async (tx) => {
      const sender = await tx.user.findUnique({
        where: { id: req.user.id },
        select: { id: true, accountType: true, subscription: true }
      });
      if (!sender) return { error: "Usuario no encontrado.", status: 404 };

      const existing = await tx.like.findUnique({
        where: { fromUserId_toUserId: { fromUserId: req.user.id, toUserId: userId } }
      });
      if (!existing && sender.accountType === "TALENT") {
        const entitlements = buildEntitlements(sender, sender.subscription);
        const dayStart = argentinaDayStart();
        const used = await tx.like.count({
          where: { fromUserId: req.user.id, createdAt: { gte: dayStart } }
        });
        const limit = entitlements.limits.dailyLikes;
        if (used >= limit) {
          return {
            error: `Alcanzaste el límite de ${limit} Me gusta por día. Volvé mañana o pasate a Premium para tener 20.`,
            status: 429,
            code: "DAILY_LIKE_LIMIT",
            limit,
            used
          };
        }
      }

      if (!existing) {
        await tx.like.create({ data: { fromUserId: req.user.id, toUserId: userId } });
      }
      const reciprocal = await tx.like.findUnique({
        where: { fromUserId_toUserId: { fromUserId: userId, toUserId: req.user.id } }
      });
      if (!reciprocal) return { matched: false };

      const [userAId, userBId] = [req.user.id, userId].sort();
      const match = await tx.match.upsert({
        where: { userAId_userBId: { userAId, userBId } },
        create: { userAId, userBId },
        update: {},
        include: { conversation: true }
      });
      const conversation = match.conversation || await tx.conversation.create({ data: { matchId: match.id } });
      return { matched: true, match: { ...match, conversation } };
    }, { isolationLevel: "Serializable" });

    if (result.error) return res.status(result.status).json(result);
    return res.status(201).json(result);
  } catch (error) {
    if (error?.code === "P2034") {
      return res.status(409).json({ error: "Se está procesando otra acción. Probá nuevamente." });
    }
    return next(error);
  }
});

router.delete("/:userId", requireAuth, async (req, res, next) => {
  try {
    await prisma.like.deleteMany({ where: { fromUserId: req.user.id, toUserId: req.params.userId } });
    res.status(204).end();
  } catch (error) { next(error); }
});

export default router;
