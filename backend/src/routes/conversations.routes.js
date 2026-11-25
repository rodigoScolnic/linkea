import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
const router = Router();
const participantFilter = (userId) => ({ OR: [{ match: { is: { OR: [{ userAId: userId }, { userBId: userId }] } } }, { invitation: { is: { OR: [{ institutionId: userId }, { talentId: userId }] } } }] });
const access = (id, userId) => prisma.conversation.findFirst({ where: { id, ...participantFilter(userId) } });
router.get("/", requireAuth, async (req, res, next) => {
  try {
    const conversations = await prisma.conversation.findMany({
      where: participantFilter(req.user.id),
      include: { match: { include: { userA: { select: { id: true, username: true, profile: true } }, userB: { select: { id: true, username: true, profile: true } } } }, invitation: { include: { institution: { select: { id: true, username: true, institutionProfile: true } }, talent: { select: { id: true, username: true, profile: true } } } }, messages: { take: 1, orderBy: { createdAt: "desc" } } }, orderBy: { createdAt: "desc" }
    });
    res.json({ conversations });
  } catch (error) { next(error); }
});
router.get("/:id/messages", requireAuth, async (req, res, next) => {
  try {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    if (!await access(id, req.user.id)) return res.status(404).json({ error: "Conversación no encontrada." });
    const messages = await prisma.message.findMany({ where: { conversationId: id }, include: { sender: { select: { id: true, username: true } } }, orderBy: { createdAt: "asc" }, take: 100 });
    res.json({ messages });
  } catch (error) { next(error); }
});
router.post("/:id/messages", requireAuth, async (req, res, next) => {
  try {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    const { content } = z.object({ content: z.string().trim().min(1).max(2000) }).parse(req.body);
    if (!await access(id, req.user.id)) return res.status(404).json({ error: "Conversación no encontrada." });
    const message = await prisma.message.create({ data: { conversationId: id, senderId: req.user.id, content }, include: { sender: { select: { id: true, username: true } } } });
    res.status(201).json({ message });
  } catch (error) { next(error); }
});
export default router;