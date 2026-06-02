import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const OTP_TTL_MS = 10 * 60 * 1000;
const OTP_LENGTH = 6;
const MAX_SENDS_PER_WINDOW = 5;
const SEND_WINDOW_MS = 15 * 60 * 1000;

function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function createAndStoreOtp(phone: string): Promise<{
  code: string;
  expiresAt: Date;
}> {
  const since = new Date(Date.now() - SEND_WINDOW_MS);
  const recent = await prisma.phoneOtp.count({
    where: { phone, createdAt: { gte: since } },
  });
  if (recent >= MAX_SENDS_PER_WINDOW) {
    throw new Error("Too many OTP requests. Try again in a few minutes.");
  }

  await prisma.phoneOtp.deleteMany({
    where: { phone, expiresAt: { lt: new Date() } },
  });

  const code = generateCode();
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  await prisma.phoneOtp.create({
    data: { phone, codeHash, expiresAt },
  });

  return { code, expiresAt };
}

export async function verifyOtp(phone: string, code: string): Promise<boolean> {
  const rows = await prisma.phoneOtp.findMany({
    where: { phone, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
    take: 3,
  });

  for (const row of rows) {
    if (await bcrypt.compare(code, row.codeHash)) {
      await prisma.phoneOtp.deleteMany({ where: { phone } });
      return true;
    }
  }
  return false;
}

export { OTP_LENGTH, OTP_TTL_MS };
