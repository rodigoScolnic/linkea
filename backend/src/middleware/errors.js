export function notFound(req, res) {
  res.status(404).json({ error: "Ruta no encontrada." });
}
export function errorHandler(error, req, res, next) {
  console.error(error);
  if (error.code === "P2002") return res.status(409).json({ error: "Ese email o nombre de usuario ya está registrado." });
  if (error.name === "ZodError") return res.status(400).json({ error: "Datos inválidos.", details: error.issues });
  res.status(500).json({ error: process.env.NODE_ENV === "production" ? "Ocurrió un error interno." : error.message });
}