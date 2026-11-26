import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { getIO } from "../realtime.js";

const router = Router();

async function getAccountType(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { accountType: true } });
  return user?.accountType || null;
}

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const accountType = await getAccountType(req.user.id);
    if (!accountType) return res.status(404).json({ error: "Usuario no encontrado." });
    const where = accountType === "INSTITUTION"
      ? { institutionId: req.user.id }
      : { talentId: req.user.id };
    const invitations = await prisma.professionalInvitation.findMany({
      where,
      include: {
        institution: { select: { id: true, username: true, institutionProfile: true } },
        talent: { select: { id: true, username: true, profile: true } },
        conversation: { select: { id: true } }
      },
      orderBy: { createdAt: "desc" }
    });
    res.json({ invitations });
  } catch (error) { next(error); }
});

router.post("/", requireAuth, async (req, res, next) => {
  try {
    if (await getAccountType(req.user.id) !== "INSTITUTION") {
      return res.status(403).json({ error: "Solo las instituciones pueden enviar invitaciones." });
    }
    const data = z.object({
      talentId: z.string().uuid(),
      title: z.string().trim().min(3).max(120),
      message: z.string().trim().min(10).max(2000)
    }).parse(req.body);
    const talent = await prisma.user.findFirst({
      where: { id: data.talentId, accountType: "TALENT", profile: { isNot: null } },
      select: { id: true }
    });
    if (!talent) return res.status(404).json({ error: "No encontramos ese perfil de talento." });
    const pending = await prisma.professionalInvitation.findFirst({
      where: { institutionId: req.user.id, talentId: talent.id, status: "PENDING" },
      select: { id: true }
    });
    if (pending) return res.status(409).json({ error: "Ya tenés una invitación pendiente para este talento." });
    const result = await prisma.$transaction(async (tx) => {
      const created = await tx.professionalInvitation.create({
        data: { institutionId: req.user.id, talentId: talent.id, title: data.title, message: data.message },
        include: {
          institution: { select: { id: true, username: true, institutionProfile: true } },
          talent: { select: { id: true, username: true, profile: true } }
        }
      });
      const notification = await tx.notification.create({
        data: {
          recipientId: talent.id,
          actorId: req.user.id,
          type: "PROFESSIONAL_INVITATION",
          title: "Nueva invitación profesional",
          message: data.title,
          link: "#contactos"
        }
      });
      return { invitation: created, notification };
    });
    getIO()?.to("user:" + talent.id).emit("notification:new", result.notification);
    res.status(201).json({ invitation: result.invitation });
  } catch (error) { next(error); }
});

router.patch("/:id", requireAuth, async (req, res, next) => {
  try {
    if (await getAccountType(req.user.id) !== "TALENT") {
      return res.status(403).json({ error: "Solo los talentos pueden responder invitaciones." });
    }
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    const { status } = z.object({ status: z.enum(["ACCEPTED", "REJECTED"]) }).parse(req.body);
    const invitation = await prisma.professionalInvitation.findFirst({
      where: { id, talentId: req.user.id },
      select: { id: true, status: true }
    });
    if (!invitation) return res.status(404).json({ error: "Invitación no encontrada." });
    if (invitation.status !== "PENDING") {
      return res.status(409).json({ error: "Esta invitación ya fue respondida." });
    }

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.professionalInvitation.update({
        where: { id },
        data: { status },
        include: {
          institution: { select: { id: true, username: true, institutionProfile: true } },
          talent: { select: { id: true, username: true, profile: true } }
        }
      });
      const conversation = status === "ACCEPTED"
        ? await tx.conversation.create({ data: { invitationId: id } })
        : null;
      const notification = await tx.notification.create({
        data: {
          recipientId: updated.institutionId,
          actorId: req.user.id,
          type: "INVITATION_RESPONSE",
          title: status === "ACCEPTED" ? "Invitación aceptada" : "Invitación rechazada",
          message: `Tu invitación «${updated.title}» fue ${status === "ACCEPTED" ? "aceptada" : "rechazada"}.`,
          link: conversation ? "/home/mensajes?conversationId=" + encodeURIComponent(conversation.id) : "#contactos"
        }
      });
      return { invitation: updated, conversation, notification };
    });
    getIO()?.to("user:" + result.invitation.institutionId).emit("notification:new", result.notification);
    res.json({ invitation: result.invitation, conversation: result.conversation });
  } catch (error) { next(error); }
});

export default router;
