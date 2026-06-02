import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function getOwnerSession() {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "OWNER" || !session.user.id) {
    return null;
  }
  return session;
}
