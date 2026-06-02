import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Prisma } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { bookingUpdateSchema } from "@/lib/validators";
import { sendOwnerBookingRequest } from "@/lib/email";

const appUrl = () =>
  process.env.NEXTAUTH_URL?.replace(/\/$/, "") ?? "http://localhost:3000";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bookingUpdateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Validation failed",
        issues: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  const existing = await prisma.booking.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  const patch = { ...parsed.data };
  let notifyOwner = false;
  let owner = null;

  if (patch.ownerId) {
    owner = await prisma.owner.findUnique({ where: { id: patch.ownerId } });
    if (!owner) {
      return NextResponse.json({ error: "Owner not found" }, { status: 400 });
    }
    if (patch.ownerId !== existing.ownerId) {
      patch.status = "AWAITING_OWNER";
      notifyOwner = true;
    }
  }

  let updated;
  try {
    updated = await prisma.booking.update({
      where: { id: params.id },
      data: patch,
      include: {
        owner: { select: { id: true, name: true, company: true, email: true } },
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }
    throw e;
  }

  if (notifyOwner && updated.owner && updated.customerEmail) {
    await sendOwnerBookingRequest({
      to: updated.owner.email,
      ownerName: updated.owner.name,
      bookingId: updated.id,
      pickupCity: updated.pickupCity,
      dropCity: updated.dropCity,
      truckType: updated.truckType,
      weightTons: updated.weightTons,
      fareEstimate: updated.fareEstimate,
      bookingDate: updated.bookingDate,
      customerName: updated.customerName,
      customerEmail: updated.customerEmail,
      customerPhone: updated.customerPhone,
      portalUrl: `${appUrl()}/owner`,
    });
  }

  return NextResponse.json({ booking: updated });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    await prisma.booking.delete({ where: { id: params.id } });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }
    throw e;
  }
  return NextResponse.json({ ok: true });
}
