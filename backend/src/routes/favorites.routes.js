import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

async function requireInstitution(req, res) {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { accountType: true }
  });
  if (!user) {
    res.status(404).json({ error: "Usuario no encontrado." });
    return false;
  }
  if (user.accountType !== "INSTITUTION") {
    res.status(403).json({ error: "Esta función es exclusiva para instituciones." });
    return false;
  }
  return true;
}

router.get("/", requireAuth, async (req, res, next) => {
  try {
    if (!await requireInstitution(req, res)) return;
    const favorites = await prisma.institutionFavorite.findMany({
      where: { institutionId: req.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        talent: {
          select: {
            id: true,
            username: true,
            profile: {
              select: {
                displayName: true,
                photoUrl: true,
                city: true,
                vocalRegister: true,
                bio: true,
                birthDate: true
              }
            }
          }
        }
      }
    });
    res.json({ favorites });
  } catch (error) { next(error); }
});

router.post("/:talentId", requireAuth, async (req, res, next) => {
  try {
    if (!await requireInstitution(req, res)) return;
    const talent = await prisma.user.findFirst({
      where: { id: req.params.talentId, accountType: "TALENT", profile: { isNot: null } },
      select: { id: true }
    });
    if (!talent) return res.status(404).json({ error: "No encontramos ese perfil de talento." });
    const favorite = await prisma.institutionFavorite.upsert({
      where: {
        institutionId_talentId: {
          institutionId: req.user.id,
          talentId: talent.id
        }
      },
      create: { institutionId: req.user.id, talentId: talent.id },
      update: {}
    });
    res.status(201).json({ favorite });
  } catch (error) { next(error); }
});

router.delete("/:talentId", requireAuth, async (req, res, next) => {
  try {
    if (!await requireInstitution(req, res)) return;
    await prisma.institutionFavorite.deleteMany({
      where: { institutionId: req.user.id, talentId: req.params.talentId }
    });
    res.status(204).end();
  } catch (error) { next(error); }
});

export default router;
