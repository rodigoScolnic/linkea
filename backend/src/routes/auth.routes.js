import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
const vocalRegisters = ["Tenor", "Barítono", "Bajo", "Soprano", "Mezzo", "Contralto"];
const institutionTypes = ["Teatro", "Compañía", "Conservatorio", "Coro", "Agencia", "Otra"];

const registerSchema = z.object({
  accountType: z.enum(["TALENT", "INSTITUTION"]).default("TALENT"),
  email: z.string().email().max(254),
  username: z.string().trim().min(3).max(30).regex(/^[a-zA-Z0-9_.-]+$/),
  password: z.string().min(8).max(72),
  displayName: z.string().min(2).max(60).optional(),
  vocalRegister: z.enum(vocalRegisters).optional(),
  institutionName: z.string().min(2).max(100).optional(),
  institutionType: z.enum(institutionTypes).optional()
}).superRefine((data, ctx) => {
  if (data.accountType === "TALENT") {
    if (!data.displayName) ctx.addIssue({ code: "custom", path: ["displayName"], message: "Ingresá tu nombre." });
    if (!data.vocalRegister) ctx.addIssue({ code: "custom", path: ["vocalRegister"], message: "Seleccioná tu registro vocal." });
  }
  if (data.accountType === "INSTITUTION") {
    if (!data.institutionName) ctx.addIssue({ code: "custom", path: ["institutionName"], message: "Ingresá el nombre de la institución." });
    if (!data.institutionType) ctx.addIssue({ code: "custom", path: ["institutionType"], message: "Seleccioná el tipo de institución." });
  }
});

const loginSchema = z.object({ identifier: z.string().min(1), password: z.string().min(1) });
const tokenFor = user => jwt.sign({}, process.env.JWT_SECRET, { subject: user.id, expiresIn: process.env.JWT_EXPIRES_IN || "7d" });
const safeUser = ({ passwordHash, ...user }) => user;

const userIncludes = {
  profile: { include: { media: { orderBy: { createdAt: "desc" } } } },
  institutionProfile: true
};

router.post("/register", async (req, res, next) => {
  try {
    const data = registerSchema.parse(req.body);
    const passwordHash = await bcrypt.hash(data.password, 12);
    const user = await prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        username: data.username.trim().toLowerCase(),
        passwordHash,
        accountType: data.accountType,
        ...(data.accountType === "TALENT"
          ? { profile: { create: { displayName: data.displayName, vocalRegister: data.vocalRegister } } }
          : { institutionProfile: { create: { name: data.institutionName, type: data.institutionType } } })
      },
      include: userIncludes
    });
    res.status(201).json({ user: safeUser(user), token: tokenFor(user) });
  } catch (error) { next(error); }
});

router.post("/login", async (req, res, next) => {
  try {
    const { identifier, password } = loginSchema.parse(req.body);
    const value = identifier.toLowerCase();
    const user = await prisma.user.findFirst({
      where: { OR: [{ email: value }, { username: value }] },
      include: userIncludes
    });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: "Usuario o contraseña incorrectos." });
    }
    res.json({ user: safeUser(user), token: tokenFor(user) });
  } catch (error) { next(error); }
});

router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true, email: true, username: true, accountType: true, createdAt: true,
        profile: { include: { media: { orderBy: { createdAt: "desc" } } } },
        institutionProfile: true
      }
    });
    if (!user) return res.status(404).json({ error: "Usuario no encontrado." });
    res.json({ user });
  } catch (error) { next(error); }
});

export default router;
