import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getOwnerSession } from "@/lib/owner-auth";
import { prisma } from "@/lib/prisma";
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

  const booking = await prisma.booking.findFirst({
    where: { id: params.id, ownerId: session.user.id },
    include: { owner: true },
  });

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

  let updated;
  try {
    updated = await prisma.booking.update({
      where: { id: booking.id },
      data: { status: newStatus },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }
    throw e;
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
