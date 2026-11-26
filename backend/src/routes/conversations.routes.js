import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { getIO } from "../realtime.js";

const router = Router();

const participantFilter = (userId) => ({
  OR: [
    { match: { is: { OR: [{ userAId: userId }, { userBId: userId }] } } },
    { invitation: { is: { OR: [{ institutionId: userId }, { talentId: userId }] } } }
  ]
});

const access = (id, userId) => prisma.conversation.findFirst({
  where: { id, ...participantFilter(userId) },
  include: {
    match: { select: { userAId: true, userBId: true } },
    invitation: { select: { institutionId: true, talentId: true } }
  }
});

function getOtherParticipant(conversation, userId) {
  if (conversation.match) {
    return conversation.match.userAId === userId
      ? conversation.match.userBId
      : conversation.match.userAId;
  }
  if (conversation.invitation) {
    return conversation.invitation.institutionId === userId
      ? conversation.invitation.talentId
      : conversation.invitation.institutionId;
  }
  return null;
}

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const conversations = await prisma.conversation.findMany({
      where: participantFilter(req.user.id),
      include: {
        match: {
          include: {
            userA: { select: { id: true, username: true, profile: true } },
            userB: { select: { id: true, username: true, profile: true } }
          }
        },
        invitation: {
          include: {
            institution: { select: { id: true, username: true, institutionProfile: true } },
            talent: { select: { id: true, username: true, profile: true } }
          }
        },
        messages: { take: 1, orderBy: { createdAt: "desc" } }
      }
    });

    const withUnread = await Promise.all(conversations.map(async (conversation) => ({
      ...conversation,
      unreadCount: await prisma.message.count({
        where: {
          conversationId: conversation.id,
          senderId: { not: req.user.id },
          readAt: null
        }
      })
    })));

    withUnread.sort((a, b) => {
      const aDate = a.messages[0]?.createdAt || a.createdAt;
      const bDate = b.messages[0]?.createdAt || b.createdAt;
      return new Date(bDate).getTime() - new Date(aDate).getTime();
    });

    res.json({ conversations: withUnread });
  } catch (error) { next(error); }
});

router.get("/:id/messages", requireAuth, async (req, res, next) => {
  try {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    if (!await access(id, req.user.id)) {
      return res.status(404).json({ error: "Conversación no encontrada." });
    }

    const query = z.object({
      before: z.string().datetime().optional(),
      limit: z.coerce.number().int().min(1).max(100).default(50)
    }).parse(req.query);

    const where = {
      conversationId: id,
      ...(query.before ? { createdAt: { lt: new Date(query.before) } } : {})
    };
    const rows = await prisma.message.findMany({
      where,
      include: { sender: { select: { id: true, username: true } } },
      orderBy: { createdAt: "desc" },
      take: query.limit + 1
    });
    const hasMore = rows.length > query.limit;
    const messages = rows.slice(0, query.limit).reverse();
    res.json({ messages, hasMore });
  } catch (error) { next(error); }
});

router.post("/:id/messages", requireAuth, async (req, res, next) => {
  try {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    const { content } = z.object({ content: z.string().trim().min(1).max(2000) }).parse(req.body);
    const conversation = await access(id, req.user.id);
    if (!conversation) return res.status(404).json({ error: "Conversación no encontrada." });
    const recipientId = getOtherParticipant(conversation, req.user.id);
    if (!recipientId) return res.status(400).json({ error: "No se pudo identificar al destinatario." });

    const result = await prisma.$transaction(async (tx) => {
      const message = await tx.message.create({
        data: { conversationId: id, senderId: req.user.id, content },
        include: { sender: { select: { id: true, username: true } } }
      });
      const notification = await tx.notification.create({
        data: {
          recipientId,
          actorId: req.user.id,
          type: "CHAT_MESSAGE",
          title: "Nuevo mensaje",
          message: content.length > 120 ? `${content.slice(0, 117)}...` : content,
          link: `/home/mensajes?conversationId=${encodeURIComponent(id)}`
        }
      });
      return { message, notification };
    });

    const io = getIO();
    io?.to(`conversation:${id}`).emit("message:new", result.message);
    io?.to(`user:${recipientId}`).emit("notification:new", result.notification);
    res.status(201).json({ message: result.message });
  } catch (error) { next(error); }
});

router.patch("/:id/read", requireAuth, async (req, res, next) => {
  try {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    if (!await access(id, req.user.id)) {
      return res.status(404).json({ error: "Conversación no encontrada." });
    }
    const readAt = new Date();
    await prisma.message.updateMany({
      where: { conversationId: id, senderId: { not: req.user.id }, readAt: null },
      data: { readAt }
    });
    getIO()?.to(`conversation:${id}`).emit("messages:read", {
      conversationId: id,
      readerId: req.user.id,
      readAt: readAt.toISOString()
    });
    res.json({ success: true, readAt });
  } catch (error) { next(error); }
});

export default router;
