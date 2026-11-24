# Linkea API
Backend REST: Node.js, Express, Prisma 7 y PostgreSQL.

## Requisitos
- Node.js 20.19+ (recomendado Node 22 LTS)
- Una base PostgreSQL accesible desde tu equipo

## Instalación
1. Copiar `.env.example` a `.env` y completar `DATABASE_URL` y `JWT_SECRET`.
2. Ejecutar `npm install`.
3. Ejecutar `npm run db:generate`.
4. Ejecutar `npm run db:migrate -- --name init`.
5. Ejecutar `npm run dev`.

API: http://localhost:3001. Salud: GET /api/health.

## Endpoints
- POST /api/auth/register { email, username, password, displayName }
- POST /api/auth/login { identifier, password }
- GET /api/auth/me
- GET/PUT /api/profile
- GET /api/discover
- POST/DELETE /api/likes/:userId
- GET /api/matches
- GET /api/conversations
- GET /api/conversations/:id/messages
- POST /api/conversations/:id/messages

En rutas protegidas enviar Authorization: Bearer <token>.
