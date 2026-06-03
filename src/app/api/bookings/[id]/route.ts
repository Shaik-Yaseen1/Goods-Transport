import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  deleteBooking,
  findBookingById,
  findOwnerById,
  updateBooking,
} from "@/lib/data";
import { bookingUpdateSchema } from "@/lib/validators";
import { sendOwnerBookingRequest } from "@/lib/email";

import { getSiteUrl } from "@/lib/db-config";

const appUrl = () => getSiteUrl();

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

  const existing = await findBookingById(params.id);
  if (!existing) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  const patch = { ...parsed.data };
  let notifyOwner = false;
  let owner = null;

  if (patch.ownerId) {
    owner = await findOwnerById(patch.ownerId);
    if (!owner) {
      return NextResponse.json({ error: "Owner not found" }, { status: 400 });
    }
    if (patch.ownerId !== existing.ownerId) {
      patch.status = "AWAITING_OWNER";
      notifyOwner = true;
    }
  }

  const updated = await updateBooking(params.id, patch, true);
  if (!updated) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  if (
    notifyOwner &&
    "owner" in updated &&
    updated.owner &&
    updated.customerEmail
  ) {
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

  const ok = await deleteBooking(params.id);
  if (!ok) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
