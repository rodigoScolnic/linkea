import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
const router = Router();
router.get("/", requireAuth, async (req, res, next) => {
  try {
    const matches = await prisma.match.findMany({
      where: { OR: [{ userAId: req.user.id }, { userBId: req.user.id }] },
      include: { userA: { select: { id: true, username: true, profile: true } }, userB: { select: { id: true, username: true, profile: true } }, conversation: { select: { id: true } } },
      orderBy: { createdAt: "desc" }
    });
    res.json({ matches: matches.map(match => ({ ...match, otherUser: match.userAId === req.user.id ? match.userB : match.userA })) });
  } catch (error) { next(error); }
});
export default router;