import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { recipientId: req.user.id },
      orderBy: { createdAt: "desc" },
      take: 50
    });
    const unreadCount = await prisma.notification.count({ where: { recipientId: req.user.id, readAt: null } });
    res.json({ notifications, unreadCount });
  } catch (error) { next(error); }
});

router.patch("/read-all", requireAuth, async (req, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: { recipientId: req.user.id, readAt: null },
      data: { readAt: new Date() }
    });
    res.json({ success: true });
  } catch (error) { next(error); }
});

router.patch("/:id/read", requireAuth, async (req, res, next) => {
  try {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    const result = await prisma.notification.updateMany({
      where: { id, recipientId: req.user.id, readAt: null },
      data: { readAt: new Date() }
    });
    if (!result.count) {
      const exists = await prisma.notification.findFirst({ where: { id, recipientId: req.user.id }, select: { id: true } });
      if (!exists) return res.status(404).json({ error: "Notificación no encontrada." });
    }
    res.json({ success: true });
  } catch (error) { next(error); }
});

export default router;
