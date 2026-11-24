import { Router } from "express";
import express from "express";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
const schema = z.object({
  displayName: z.string().min(2).max(60),
  vocalRegister: z.enum(["Tenor", "Barítono", "Bajo", "Soprano", "Mezzo", "Contralto"]).nullable().optional(),
  bio: z.string().max(500).nullable().optional(),
  city: z.string().max(100).nullable().optional(),
  birthDate: z.string().datetime().nullable().optional(),
  interests: z.array(z.string().max(40)).max(30).optional(),
  photoUrl: z.string().url().nullable().optional()
});

const allowedImageTypes = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp"
};

router.get("/", requireAuth, async (req, res, next) => {
  try {
    res.json({ profile: await prisma.profile.findUnique({ where: { userId: req.user.id } }) });
  } catch (error) {
    next(error);
  }
});

router.put("/", requireAuth, async (req, res, next) => {
  try {
    const data = schema.parse(req.body);
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
        birthDate: data.birthDate ? new Date(data.birthDate) : null
      }
    });

    res.json({ profile });
  } catch (error) {
    next(error);
  }
});

// Recibe la imagen como archivo binario y la guarda en Supabase Storage.
router.put(
  "/photo",
  requireAuth,
  express.raw({ type: Object.keys(allowedImageTypes), limit: "5mb" }),
  async (req, res, next) => {
    try {
      const contentType = req.headers["content-type"];
      const extension = allowedImageTypes[contentType];

      if (!extension || !Buffer.isBuffer(req.body) || req.body.length === 0) {
        return res.status(400).json({ error: "Seleccioná una imagen JPG, PNG o WEBP." });
      }

      const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/$/, "");
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      const bucket = process.env.SUPABASE_STORAGE_BUCKET || "linkea-avatars";

      if (!supabaseUrl || !serviceKey) {
        return res.status(500).json({ error: "Falta configurar el almacenamiento de imágenes en el servidor." });
      }

      const filePath = `${req.user.id}/${randomUUID()}.${extension}`;
      const uploadResponse = await fetch(
        `${supabaseUrl}/storage/v1/object/${bucket}/${filePath}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${serviceKey}`,
            apikey: serviceKey,
            "Content-Type": contentType,
            "x-upsert": "true"
          },
          body: req.body
        }
      );

      if (!uploadResponse.ok) {
        const details = await uploadResponse.json().catch(() => null);
        console.error("Supabase Storage upload error:", details || uploadResponse.statusText);
        return res.status(502).json({ error: "No se pudo guardar la foto. Revisá la configuración del almacenamiento." });
      }

      const photoUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${filePath}`;
      const profile = await prisma.profile.upsert({
        where: { userId: req.user.id },
        create: { userId: req.user.id, displayName: "Mi perfil", photoUrl },
        update: { photoUrl }
      });

      res.json({ photoUrl: profile.photoUrl, profile });
    } catch (error) {
      if (error.status === 413) {
        return res.status(413).json({ error: "La foto no puede superar los 5 MB." });
      }
      next(error);
    }
  }
);

export default router;
