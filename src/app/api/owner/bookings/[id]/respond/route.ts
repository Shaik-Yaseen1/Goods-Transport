import { NextRequest, NextResponse } from "next/server";
import { getOwnerSession } from "@/lib/owner-auth";
import { findOwnerBooking, updateBooking } from "@/lib/data";
import { ownerBookingRespondSchema } from "@/lib/validators";
import { sendCustomerOwnerDecision } from "@/lib/email";
import { isPlaceholderEmail } from "@/lib/user-email";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getOwnerSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = ownerBookingRespondSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const booking = await findOwnerBooking(session.user.id, params.id);
  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  if (booking.status !== "AWAITING_OWNER") {
    return NextResponse.json(
      { error: "This booking was already responded to" },
      { status: 400 }
    );
  }

  const accepted = parsed.data.action === "accept";
  const newStatus = accepted ? "CONFIRMED" : "DECLINED";

  const updated = await updateBooking(booking.id, { status: newStatus });
  if (!updated) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  if (booking.customerEmail && !isPlaceholderEmail(booking.customerEmail)) {
    await sendCustomerOwnerDecision({
      to: booking.customerEmail,
      customerName: booking.customerName,
      bookingId: booking.id,
      pickupCity: booking.pickupCity,
      dropCity: booking.dropCity,
      accepted,
      ownerName: booking.owner?.name ?? "Fleet owner",
    });
  }

  return NextResponse.json({ booking: updated });
}
