import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
const router = Router();
router.post("/:userId", requireAuth, async (req, res, next) => {
  try {
    const userId = req.params.userId;
    if (userId === req.user.id) return res.status(400).json({ error: "No podés darte like a vos mismo." });
    if (!await prisma.user.findUnique({ where: { id: userId }, select: { id: true } })) return res.status(404).json({ error: "Usuario no encontrado." });
    await prisma.like.upsert({
      where: { fromUserId_toUserId: { fromUserId: req.user.id, toUserId: userId } },
      create: { fromUserId: req.user.id, toUserId: userId }, update: {}
    });
    const reciprocal = await prisma.like.findUnique({ where: { fromUserId_toUserId: { fromUserId: userId, toUserId: req.user.id } } });
    if (!reciprocal) return res.status(201).json({ matched: false });
    const [userAId, userBId] = [req.user.id, userId].sort();
    const match = await prisma.match.upsert({
      where: { userAId_userBId: { userAId, userBId } }, create: { userAId, userBId }, update: {},
      include: { conversation: true }
    });
    const conversation = match.conversation || await prisma.conversation.create({ data: { matchId: match.id } });
    res.status(201).json({ matched: true, match: { ...match, conversation } });
  } catch (error) { next(error); }
});
router.delete("/:userId", requireAuth, async (req, res, next) => {
  try { await prisma.like.deleteMany({ where: { fromUserId: req.user.id, toUserId: req.params.userId } }); res.status(204).end(); }
  catch (error) { next(error); }
});
export default router;