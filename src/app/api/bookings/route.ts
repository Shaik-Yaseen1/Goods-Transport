import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  countOwners,
  createBooking,
  findFirstOwner,
  findOwnerById,
  listBookingsForAdmin,
} from "@/lib/data";
import { bookingCreateSchema } from "@/lib/validators";
import { calculateFare } from "@/lib/fare";
import { estimateDistanceKm } from "@/lib/route-distance";
import {
  sendBookingConfirmation,
  sendOwnerBookingRequest,
} from "@/lib/email";
import { isPlaceholderEmail } from "@/lib/user-email";

import { getSiteUrl } from "@/lib/db-config";

const appUrl = () => getSiteUrl();

export async function POST(req: NextRequest) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = bookingCreateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Validation failed",
        issues: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  const data = parsed.data;

  /* Customer login auth — disabled
  const session = await getCustomerSession();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Sign in to book a truck." },
      { status: 401 }
    );
  }
  const account = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, name: true, phone: true, role: true },
  });
  if (!account || account.role !== "USER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  */

  let ownerId = data.ownerId ?? null;
  if (!ownerId) {
    const ownerCount = await countOwners();
    if (ownerCount === 1) {
      const only = await findFirstOwner();
      ownerId = only?.id ?? null;
    }
  }

  let owner = null;
  if (ownerId) {
    owner = await findOwnerById(ownerId);
    if (!owner) {
      return NextResponse.json({ error: "Owner not found" }, { status: 400 });
    }
  }

  const distanceKm = estimateDistanceKm(data.pickupCity, data.dropCity);
  const fare = calculateFare({
    truckType: data.truckType,
    distanceKm,
    weightTons: data.weightTons,
  });

  const status = ownerId ? "AWAITING_OWNER" : "PENDING";

  const customerEmail = data.customerEmail;

  let booking;
  try {
    booking = await createBooking({
      pickupCity: data.pickupCity,
      dropCity: data.dropCity,
      goodsType: data.goodsType,
      weightTons: data.weightTons,
      distanceKm,
      truckType: data.truckType,
      fareEstimate: fare.total,
      bookingDate: data.bookingDate,
      customerName: data.customerName,
      customerEmail,
      customerPhone: data.customerPhone,
      notes: null,
      ownerId,
      userId: null,
      status,
    });
  } catch {
    return NextResponse.json(
      { error: "Could not create booking. Please try again." },
      { status: 500 }
    );
  }

  if (customerEmail && !isPlaceholderEmail(customerEmail)) {
    await sendBookingConfirmation({
      to: customerEmail,
    bookingId: booking.id,
    pickupCity: booking.pickupCity,
    dropCity: booking.dropCity,
    truckType: booking.truckType,
    weightTons: booking.weightTons,
    distanceKm: booking.distanceKm,
    fareEstimate: booking.fareEstimate,
    bookingDate: booking.bookingDate,
    customerName: booking.customerName,
    awaitingOwner: status === "AWAITING_OWNER",
    ownerName: booking.owner?.name,
    });
  }

  if (owner) {
    await sendOwnerBookingRequest({
      to: owner.email,
      ownerName: owner.name,
      bookingId: booking.id,
      pickupCity: booking.pickupCity,
      dropCity: booking.dropCity,
      truckType: booking.truckType,
      weightTons: booking.weightTons,
      fareEstimate: booking.fareEstimate,
      bookingDate: booking.bookingDate,
      customerName: booking.customerName,
      customerEmail: customerEmail ?? "",
      customerPhone: booking.customerPhone,
      portalUrl: `${appUrl()}/owner`,
    });
  }

  return NextResponse.json({ booking, fare, distanceKm }, { status: 201 });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const bookings = await listBookingsForAdmin();

  return NextResponse.json({ bookings });
}
