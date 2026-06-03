import { NextRequest, NextResponse } from "next/server";
import { listBookingsByEmail, listBookingsByIds } from "@/lib/data";
import { bookingHistoryQuerySchema } from "@/lib/validators";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const parsed = bookingHistoryQuerySchema.safeParse({
    email: searchParams.get("email") ?? undefined,
    ids: searchParams.get("ids") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid request",
        issues: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  const { email, ids } = parsed.data;

  if (ids.length > 0) {
    const byIds = await listBookingsByIds(ids);
    return NextResponse.json({ bookings: byIds });
  }

  const bookings = await listBookingsByEmail(email!);
  return NextResponse.json({ bookings });
}
