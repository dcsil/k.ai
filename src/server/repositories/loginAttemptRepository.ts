import prisma from "@/lib/prisma";

export async function recordLoginAttempt({
  userId,
  success,
  reason,
  ip,
}: {
  userId?: string;
  success: boolean;
  reason?: string;
  ip?: string;
}) {
  return prisma.loginAttempt.create({
    data: {
      userId,
      success,
      reason,
      ip,
    },
  });
}
