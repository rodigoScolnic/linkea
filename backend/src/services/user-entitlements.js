import { prisma } from "../db.js";
import { buildEntitlements } from "./entitlements.js";

export async function getUserEntitlements(userId, db = prisma) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, accountType: true, subscription: true }
  });
  if (!user) return null;
  return {
    user,
    entitlements: buildEntitlements(user, user.subscription)
  };
}
