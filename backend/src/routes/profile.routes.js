import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
const router = Router();
const schema = z.object({
  displayName: z.string().min(2).max(60), bio: z.string().max(500).nullable().optional(),
  city: z.string().max(100).nullable().optional(), birthDate: z.string().datetime().nullable().optional(),
  interests: z.array(z.string().max(40)).max(30).optional(), photoUrl: z.string().url().nullable().optional()
});
router.get("/", requireAuth, async (req, res, next) => {
  try { res.json({ profile: await prisma.profile.findUnique({ where: { userId: req.user.id } }) }); }
  catch (error) { next(error); }
});
router.put("/", requireAuth, async (req, res, next) => {
  try {
    const data = schema.parse(req.body);
    if (data.birthDate && new Date(data.birthDate) > new Date()) return res.status(400).json({ error: "La fecha de nacimiento no puede ser futura." });
    const profile = await prisma.profile.upsert({
      where: { userId: req.user.id },
      create: { ...data, birthDate: data.birthDate ? new Date(data.birthDate) : null, userId: req.user.id },
      update: { ...data, birthDate: data.birthDate ? new Date(data.birthDate) : null }
    });
    res.json({ profile });
  } catch (error) { next(error); }
});
export default router;