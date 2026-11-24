import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
const router = Router();
router.get("/", requireAuth, async (req, res, next) => {
  try {
    const take = Math.min(Math.max(Number(req.query.limit) || 20, 1), 50);
    const users = await prisma.user.findMany({
      where: {
        id: { not: req.user.id },
        likesReceived: { none: { fromUserId: req.user.id } },
        profile: { isNot: null }
      },
      select: {
        id: true,
        username: true,
        profile: { select: { displayName: true, bio: true, city: true, vocalRegister: true, interests: true, photoUrl: true } }
      },
      take,
      orderBy: { createdAt: "desc" }
    });
    res.json({ users });
  } catch (error) { next(error); }
});
export default router;