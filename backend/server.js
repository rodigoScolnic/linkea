import "dotenv/config";
import app from "./src/app.js";
import { prisma } from "./src/db.js";
const port = Number(process.env.PORT) || 3001;
if (!process.env.DATABASE_URL || !process.env.JWT_SECRET) throw new Error("Faltan DATABASE_URL o JWT_SECRET en el archivo .env");
const server = app.listen(port, () => console.log(`Linkea API escuchando en http://localhost:${port}`));
async function shutdown() {
  server.close(async () => { await prisma.$disconnect(); process.exit(0); });
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);