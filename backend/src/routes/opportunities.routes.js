import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { getIO } from "../realtime.js";

const router = Router();
async function accountType(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { accountType: true } });
  return user?.accountType || null;
}

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const role = await accountType(req.user.id);
    if (!role) return res.status(404).json({ error: "Usuario no encontrado." });
    const { city, type, vocalRegister } = req.query;
    const where = role === "INSTITUTION"
      ? { institutionId: req.user.id }
      : { status: "OPEN", OR: [{ deadline: null }, { deadline: { gte: new Date() } }] };
    if (city) where.city = { contains: String(city), mode: "insensitive" };
    if (type) where.type = String(type);
    if (vocalRegister) where.vocalRegisters = { has: String(vocalRegister) };

    const opportunities = await prisma.opportunity.findMany({
      where,
      include: {
        institution: { select: { id: true, username: true, institutionProfile: true } },
        _count: { select: { applications: true } },
        applications: role === "TALENT"
          ? { where: { talentId: req.user.id }, select: { id: true, status: true, createdAt: true } }
          : false
      },
      orderBy: [{ createdAt: "desc" }],
      take: 100
    });
    res.json({ opportunities });
  } catch (error) { next(error); }
});

router.post("/", requireAuth, async (req, res, next) => {
  try {
    if (await accountType(req.user.id) !== "INSTITUTION") {
      return res.status(403).json({ error: "Solo las instituciones pueden publicar oportunidades." });
    }
    const data = z.object({
      title: z.string().trim().min(4).max(140),
      description: z.string().trim().min(20).max(3000),
      type: z.string().trim().min(3).max(40),
      vocalRegisters: z.array(z.string().trim().min(2).max(30)).max(7).default([]),
      requirements: z.string().trim().max(2000).optional().nullable(),
      city: z.string().trim().max(100).optional().nullable(),
      country: z.string().trim().max(100).optional().nullable(),
      deadline: z.string().datetime().optional().nullable()
    }).parse(req.body);

    const opportunity = await prisma.$transaction(async (tx) => {
      const created = await tx.opportunity.create({
        data: {
          ...data,
          deadline: data.deadline ? new Date(data.deadline) : null,
          requirements: data.requirements || null,
          city: data.city || null,
          country: data.country || null,
          institutionId: req.user.id
        },
        include: { institution: { select: { id: true, username: true, institutionProfile: true } } }
      });
      const talents = await tx.user.findMany({ where: { accountType: "TALENT" }, select: { id: true } });
      if (talents.length) {
        await tx.notification.createMany({
          data: talents.map((talent) => ({
            recipientId: talent.id,
            actorId: req.user.id,
            type: "NEW_OPPORTUNITY",
            title: "Nueva oportunidad en Linkea",
            message: created.title,
            link: "#oportunidades"
          }))
        });
      }
      return { opportunity: created, recipientIds: talents.map((talent) => talent.id) };
    });
    const io = getIO();
    result.recipientIds.forEach((recipientId) => io?.to("user:" + recipientId).emit("notification:new", {
      type: "NEW_OPPORTUNITY", title: "Nueva oportunidad en Linkea", message: result.opportunity.title, link: "#oportunidades"
    }));
    res.status(201).json({ opportunity: result.opportunity });
  } catch (error) { next(error); }
});

router.get("/:id/applications", requireAuth, async (req, res, next) => {
  try {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    const opportunity = await prisma.opportunity.findFirst({
      where: { id, institutionId: req.user.id },
      select: { id: true }
    });
    if (!opportunity) return res.status(404).json({ error: "Oportunidad no encontrada." });
    const applications = await prisma.application.findMany({
      where: { opportunityId: id },
      include: { talent: { select: { id: true, username: true, profile: true } } },
      orderBy: { createdAt: "desc" }
    });
    res.json({ applications });
  } catch (error) { next(error); }
});

router.post("/:id/applications", requireAuth, async (req, res, next) => {
  try {
    if (await accountType(req.user.id) !== "TALENT") {
      return res.status(403).json({ error: "Solo los talentos pueden postularse." });
    }
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    const { message } = z.object({ message: z.string().trim().max(2000).optional() }).parse(req.body);
    const opportunity = await prisma.opportunity.findUnique({
      where: { id },
      select: { id: true, title: true, status: true, deadline: true, institutionId: true }
    });
    if (!opportunity || opportunity.status !== "OPEN" || (opportunity.deadline && opportunity.deadline < new Date())) {
      return res.status(404).json({ error: "Esta oportunidad ya no está disponible." });
    }
    const application = await prisma.$transaction(async (tx) => {
      const created = await tx.application.create({
        data: { opportunityId: id, talentId: req.user.id, message: message || null }
      });
      const notification = await tx.notification.create({
        data: {
          recipientId: opportunity.institutionId,
          actorId: req.user.id,
          type: "NEW_APPLICATION",
          title: "Nueva postulación",
          message: `Recibiste una postulación para «${opportunity.title}».`,
          link: "#oportunidades"
        }
      });
      return { application: created, notification };
    });
    getIO()?.to("user:" + opportunity.institutionId).emit("notification:new", result.notification);
    res.status(201).json({ application: result.application });
  } catch (error) {
    if (error?.code === "P2002") return res.status(409).json({ error: "Ya te postulaste a esta oportunidad." });
    next(error);
  }
});

router.patch("/:id/applications/:applicationId", requireAuth, async (req, res, next) => {
  try {
    const { id, applicationId } = z.object({ id: z.string().uuid(), applicationId: z.string().uuid() }).parse(req.params);
    const { status } = z.object({ status: z.enum(["REVIEWING", "SELECTED", "REJECTED"]) }).parse(req.body);
    const application = await prisma.application.findFirst({
      where: { id: applicationId, opportunityId: id, opportunity: { is: { institutionId: req.user.id } } },
      include: { opportunity: { select: { title: true } } }
    });
    if (!application) return res.status(404).json({ error: "Postulación no encontrada." });
    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.application.update({ where: { id: applicationId }, data: { status } });
      const notification = await tx.notification.create({
        data: {
          recipientId: application.talentId,
          actorId: req.user.id,
          type: "APPLICATION_UPDATE",
          title: "Actualización de tu postulación",
          message: `Tu postulación a «${application.opportunity.title}» cambió a: ${status === "REVIEWING" ? "En evaluación" : status === "SELECTED" ? "Seleccionada" : "No seleccionada"}.`,
          link: "#oportunidades"
        }
      });
      return { application: result, notification };
    });
    getIO()?.to("user:" + application.talentId).emit("notification:new", updated.notification);
    res.json({ application: updated.application });
  } catch (error) { next(error); }
});

router.patch("/:id/status", requireAuth, async (req, res, next) => {
  try {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    const { status } = z.object({ status: z.enum(["OPEN", "CLOSED"]) }).parse(req.body);
    const result = await prisma.opportunity.updateMany({ where: { id, institutionId: req.user.id }, data: { status } });
    if (!result.count) return res.status(404).json({ error: "Oportunidad no encontrada." });
    res.json({ success: true, status });
  } catch (error) { next(error); }
});

export default router;
