import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
const vocalRegisters = ["Tenor", "Barítono", "Bajo", "Soprano", "Mezzo", "Contralto"];

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const take = Math.min(Math.max(Number(req.query.limit) || 20, 1), 50);
    const { vocalRegister, city } = req.query;
    const minAge = req.query.minAge === "" || req.query.minAge == null ? null : Number(req.query.minAge);
    const maxAge = req.query.maxAge === "" || req.query.maxAge == null ? null : Number(req.query.maxAge);

    if (vocalRegister && !vocalRegisters.includes(vocalRegister)) {
      return res.status(400).json({ error: "El registro vocal seleccionado no es válido." });
    }
    if (minAge !== null && (!Number.isInteger(minAge) || minAge < 18 || minAge > 100)) {
      return res.status(400).json({ error: "La edad mínima debe estar entre 18 y 100." });
    }
    if (maxAge !== null && (!Number.isInteger(maxAge) || maxAge < 18 || maxAge > 100)) {
      return res.status(400).json({ error: "La edad máxima debe estar entre 18 y 100." });
    }
    if (minAge !== null && maxAge !== null && minAge > maxAge) {
      return res.status(400).json({ error: "La edad mínima no puede superar la máxima." });
    }

    const today = new Date();
    const birthDate = {};
    if (minAge !== null) birthDate.lte = new Date(Date.UTC(today.getUTCFullYear() - minAge, today.getUTCMonth(), today.getUTCDate()));
    if (maxAge !== null) birthDate.gte = new Date(Date.UTC(today.getUTCFullYear() - maxAge - 1, today.getUTCMonth(), today.getUTCDate() + 1));

    const profileWhere = {};
    if (vocalRegister) profileWhere.vocalRegister = vocalRegister;
    if (city?.trim()) profileWhere.city = { contains: city.trim(), mode: "insensitive" };
    if (Object.keys(birthDate).length) profileWhere.birthDate = birthDate;

    const users = await prisma.user.findMany({
      where: {
        id: { not: req.user.id },
        likesReceived: { none: { fromUserId: req.user.id } },
        profile: { is: profileWhere }
      },
      select: {
        id: true,
        username: true,
        profile: { select: { displayName: true, bio: true, city: true, birthDate: true, vocalRegister: true, interests: true, photoUrl: true, gender: true, languages: true, experience: true, repertoire: true, media: { orderBy: { createdAt: "desc" } } } }
      },
      take,
      orderBy: { createdAt: "desc" }
    });
    res.json({ users });
  } catch (error) { next(error); }
});

export default router;
