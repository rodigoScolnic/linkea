import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "./db.js";
import { setIO } from "./realtime.js";

const participantFilter = (userId) => ({
  OR: [
    { match: { is: { OR: [{ userAId: userId }, { userBId: userId }] } } },
    { invitation: { is: { OR: [{ institutionId: userId }, { talentId: userId }] } } }
  ]
});

async function getConversationForUser(conversationId, userId) {
  return prisma.conversation.findFirst({
    where: { id: conversationId, ...participantFilter(userId) },
    include: {
      match: { select: { userAId: true, userBId: true } },
      invitation: { select: { institutionId: true, talentId: true } }
    }
  });
}

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

export function initializeSocket(server) {
  const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  const io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("No autorizado."));
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      if (!payload.sub) return next(new Error("Sesión inválida."));
      socket.data.userId = payload.sub;
      next();
    } catch {
      next(new Error("La sesión no es válida o venció."));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.data.userId;
    socket.join(`user:${userId}`);

    socket.on("conversation:join", async (payload, acknowledge = () => {}) => {
      try {
        const parsed = z.object({ conversationId: z.string().uuid() }).parse(payload);
        const conversation = await getConversationForUser(parsed.conversationId, userId);
        if (!conversation) return acknowledge({ ok: false, error: "Conversación no encontrada." });
        socket.join(`conversation:${parsed.conversationId}`);
        acknowledge({ ok: true });
      } catch {
        acknowledge({ ok: false, error: "No pudimos abrir esta conversación." });
      }
    });

    socket.on("conversation:leave", (payload) => {
      const parsed = z.object({ conversationId: z.string().uuid() }).safeParse(payload);
      if (parsed.success) socket.leave(`conversation:${parsed.data.conversationId}`);
    });

    socket.on("message:send", async (payload, acknowledge = () => {}) => {
      try {
        const parsed = z.object({
          conversationId: z.string().uuid(),
          content: z.string().trim().min(1).max(2000)
        }).parse(payload);
        const room = `conversation:${parsed.data.conversationId}`;
        if (!socket.rooms.has(room)) {
          return acknowledge({ ok: false, error: "Primero tenés que abrir la conversación." });
        }
        const conversation = await getConversationForUser(parsed.data.conversationId, userId);
        if (!conversation) return acknowledge({ ok: false, error: "Conversación no encontrada." });
        const recipientId = getOtherParticipant(conversation, userId);
        if (!recipientId) return acknowledge({ ok: false, error: "No se pudo identificar al destinatario." });

        const result = await prisma.$transaction(async (tx) => {
          const message = await tx.message.create({
            data: {
              conversationId: parsed.data.conversationId,
              senderId: userId,
              content: parsed.data.content
            },
            include: { sender: { select: { id: true, username: true } } }
          });
          const notification = await tx.notification.create({
            data: {
              recipientId,
              actorId: userId,
              type: "CHAT_MESSAGE",
              title: "Nuevo mensaje",
              message: parsed.data.content.length > 120
                ? `${parsed.data.content.slice(0, 117)}...`
                : parsed.data.content,
              link: "/home/mensajes"
            }
          });
          return { message, notification };
        });

        io.to(room).emit("message:new", result.message);
        io.to(`user:${recipientId}`).emit("notification:new", result.notification);
        acknowledge({ ok: true, message: result.message });
      } catch (error) {
        acknowledge({
          ok: false,
          error: error?.issues?.[0]?.message || "No pudimos enviar el mensaje."
        });
      }
    });

    socket.on("conversation:read", async (payload, acknowledge = () => {}) => {
      try {
        const parsed = z.object({ conversationId: z.string().uuid() }).parse(payload);
        const room = `conversation:${parsed.data.conversationId}`;
        if (!socket.rooms.has(room)) return acknowledge({ ok: false, error: "Conversación no abierta." });
        const conversation = await getConversationForUser(parsed.data.conversationId, userId);
        if (!conversation) return acknowledge({ ok: false, error: "Conversación no encontrada." });
        const now = new Date();
        await prisma.message.updateMany({
          where: {
            conversationId: parsed.data.conversationId,
            senderId: { not: userId },
            readAt: null
          },
          data: { readAt: now }
        });
        io.to(room).emit("messages:read", {
          conversationId: parsed.data.conversationId,
          readerId: userId,
          readAt: now.toISOString()
        });
        acknowledge({ ok: true });
      } catch {
        acknowledge({ ok: false, error: "No pudimos marcar los mensajes como leídos." });
      }
    });
  });

  setIO(io);
  return io;
}
