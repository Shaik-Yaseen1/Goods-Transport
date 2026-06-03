import { NextResponse } from "next/server";
import { getOwnerSession } from "@/lib/owner-auth";
import { listBookingsForOwner } from "@/lib/data";

export async function GET() {
  const session = await getOwnerSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const bookings = await listBookingsForOwner(session.user.id);
  return NextResponse.json({ bookings });
}
