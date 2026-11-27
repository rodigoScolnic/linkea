import { Router } from "express";
import express from "express";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { getUserEntitlements } from "../services/user-entitlements.js";

const router = Router();
const genders = ["Masculino", "Femenino", "Prefiero no contestar"];
const experiences = ["Estudiante", "Amateur", "Semiprofesional", "Profesional"];
const imageTypes = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const videoTypes = { "video/mp4": "mp4", "video/webm": "webm" };
const profileSchema = z.object({
  displayName: z.string().min(2).max(60),
  vocalRegister: z.enum(["Tenor", "Barítono", "Bajo", "Soprano", "Mezzo", "Contralto"]).nullable().optional(),
  bio: z.string().max(500).nullable().optional(),
  city: z.string().max(100).nullable().optional(),
  birthDate: z.string().datetime().nullable().optional(),
  interests: z.array(z.string().trim().min(1).max(40)).max(30).optional(),
  gender: z.enum(genders).nullable().optional(),
  languages: z.array(z.string().trim().min(1).max(40)).max(20).optional(),
  experience: z.enum(experiences).nullable().optional(),
  repertoire: z.array(z.string().trim().min(1).max(120)).max(100).optional()
});

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const profile = await prisma.profile.findUnique({
      where: { userId: req.user.id },
      include: { media: { orderBy: { createdAt: "desc" } } }
    });
    res.json({ profile });
  } catch (error) { next(error); }
});

router.put("/", requireAuth, async (req, res, next) => {
  try {
    const data = profileSchema.parse(req.body);
    if (data.birthDate && new Date(data.birthDate) > new Date()) {
      return res.status(400).json({ error: "La fecha de nacimiento no puede ser futura." });
    }
    const profile = await prisma.profile.upsert({
      where: { userId: req.user.id },
      create: {
        ...data,
        birthDate: data.birthDate ? new Date(data.birthDate) : null,
        userId: req.user.id
      },
      update: {
        ...data,
        ...(data.birthDate !== undefined ? { birthDate: data.birthDate ? new Date(data.birthDate) : null } : {})
      },
      include: { media: { orderBy: { createdAt: "desc" } } }
    });
    res.json({ profile });
  } catch (error) { next(error); }
});

async function uploadToStorage(req, res, next, kind) {
  try {
    const contentType = req.headers["content-type"]?.split(";")[0]?.trim();
    const types = kind === "photo" ? imageTypes : { ...imageTypes, ...videoTypes };
    const extension = types[contentType];
    if (!extension || !Buffer.isBuffer(req.body) || req.body.length === 0) {
      return res.status(400).json({ error: kind === "photo" ? "Seleccioná una imagen JPG, PNG o WEBP." : "Formato no válido. Usá JPG, PNG, WEBP, MP4 o WEBM." });
    }
    // The avatar endpoint (/photo) is a single profile-picture slot.
    // Portfolio quotas apply to uploaded media items (/media).
    if (kind === "media") {
      const entitlementResult = await getUserEntitlements(req.user.id);
      if (!entitlementResult) return res.status(404).json({ error: "Usuario no encontrado." });

      if (entitlementResult.user.accountType === "TALENT") {
        const isVideo = contentType.startsWith("video/");
        const mediaType = isVideo ? "video" : "image";
        const limit = isVideo
          ? entitlementResult.entitlements.limits.videos
          : entitlementResult.entitlements.limits.photos;
        const used = await prisma.profileMedia.count({
          where: { type: mediaType, profile: { is: { userId: req.user.id } } }
        });

        if (used >= limit) {
          return res.status(429).json({
            code: isVideo ? "VIDEO_LIMIT" : "PHOTO_LIMIT",
            error: isVideo
              ? `Tu plan permite hasta ${limit} video(s) en el portfolio. Pasate a Premium para subir hasta 5.`
              : `Tu plan permite hasta ${limit} foto(s) en el portfolio. Pasate a Premium para subir hasta 10.`,
            limit,
            used
          });
        }
      }
    }

    const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/$/, "");
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const bucket = process.env.SUPABASE_STORAGE_BUCKET || "linkea-avatars";
    if (!supabaseUrl || !serviceKey) {
      return res.status(500).json({ error: "Falta configurar el almacenamiento de archivos en el servidor." });
    }
    const filePath = `${req.user.id}/${kind}/${randomUUID()}.${extension}`;
    const uploadResponse = await fetch(`${supabaseUrl}/storage/v1/object/${bucket}/${filePath}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${serviceKey}`, apikey: serviceKey, "Content-Type": contentType, "x-upsert": "true" },
      body: req.body
    });
    if (!uploadResponse.ok) {
      const details = await uploadResponse.json().catch(() => null);
      console.error("Supabase Storage upload error:", details || uploadResponse.statusText);
      return res.status(502).json({ error: "No se pudo guardar el archivo. Revisá la configuración del almacenamiento." });
    }
    const url = `${supabaseUrl}/storage/v1/object/public/${bucket}/${filePath}`;
    if (kind === "photo") {
      const profile = await prisma.profile.upsert({
        where: { userId: req.user.id },
        create: { userId: req.user.id, displayName: "Mi perfil", photoUrl: url },
        update: { photoUrl: url }
      });
      return res.json({ photoUrl: url, profile });
    }
    const profile = await prisma.profile.upsert({
      where: { userId: req.user.id },
      create: { userId: req.user.id, displayName: "Mi perfil" },
      update: {}
    });
    const media = await prisma.profileMedia.create({
      data: { profileId: profile.id, url, type: contentType.startsWith("video/") ? "video" : "image", fileName: req.headers["x-file-name"] || null }
    });
    return res.status(201).json({ media });
  } catch (error) {
    if (error.status === 413) return res.status(413).json({ error: "El archivo supera el tamaño permitido." });
    next(error);
  }
}

router.put("/photo", requireAuth, express.raw({ type: [...Object.keys(imageTypes)], limit: "5mb" }), (req, res, next) => uploadToStorage(req, res, next, "photo"));
router.post("/media", requireAuth, express.raw({ type: [...Object.keys(imageTypes), ...Object.keys(videoTypes)], limit: "50mb" }), (req, res, next) => uploadToStorage(req, res, next, "media"));

router.delete("/media/:id", requireAuth, async (req, res, next) => {
  try {
    const media = await prisma.profileMedia.findFirst({
      where: { id: req.params.id, profile: { userId: req.user.id } }
    });
    if (!media) return res.status(404).json({ error: "Archivo no encontrado." });
    const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/$/, "");
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const bucket = process.env.SUPABASE_STORAGE_BUCKET || "linkea-avatars";
    const marker = `/storage/v1/object/public/${bucket}/`;
    const filePath = media.url.split(marker)[1];
    if (filePath && supabaseUrl && serviceKey) {
      await fetch(`${supabaseUrl}/storage/v1/object/${bucket}/${filePath}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${serviceKey}`, apikey: serviceKey }
      });
    }
    await prisma.profileMedia.delete({ where: { id: media.id } });
    res.json({ success: true });
  } catch (error) { next(error); }
});

export default router;