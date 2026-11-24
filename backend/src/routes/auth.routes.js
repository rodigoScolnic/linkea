import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
const router = Router();
const vocalRegisters = ["Tenor", "Barítono", "Bajo", "Soprano", "Mezzo", "Contralto"];
const registerSchema = z.object({
  email: z.string().email().max(254), username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_.-]+$/),
  password: z.string().min(8).max(72), displayName: z.string().min(2).max(60),
  vocalRegister: z.enum(vocalRegisters)
});
const loginSchema = z.object({ identifier: z.string().min(1), password: z.string().min(1) });
const tokenFor = user => jwt.sign({}, process.env.JWT_SECRET, { subject: user.id, expiresIn: process.env.JWT_EXPIRES_IN || "7d" });
const safeUser = ({ passwordHash, ...user }) => user;
router.post("/register", async (req, res, next) => {
  try {
    const data = registerSchema.parse(req.body);
    const passwordHash = await bcrypt.hash(data.password, 12);
    const user = await prisma.user.create({
      data: { email: data.email.toLowerCase(), username: data.username.toLowerCase(), passwordHash,
        profile: { create: { displayName: data.displayName, vocalRegister: data.vocalRegister } } }, include: { profile: true }
    });
    res.status(201).json({ user: safeUser(user), token: tokenFor(user) });
  } catch (error) { next(error); }
});
router.post("/login", async (req, res, next) => {
  try {
    const { identifier, password } = loginSchema.parse(req.body);
    const value = identifier.toLowerCase();
    const user = await prisma.user.findFirst({ where: { OR: [{ email: value }, { username: value }] }, include: { profile: true } });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) return res.status(401).json({ error: "Usuario o contraseña incorrectos." });
    res.json({ user: safeUser(user), token: tokenFor(user) });
  } catch (error) { next(error); }
});
router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id }, select: { id: true, email: true, username: true, createdAt: true, profile: true } });
    if (!user) return res.status(404).json({ error: "Usuario no encontrado." });
    res.json({ user });
  } catch (error) { next(error); }
});
export default router;