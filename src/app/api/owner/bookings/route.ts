import { NextResponse } from "next/server";
import { getOwnerSession } from "@/lib/owner-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getOwnerSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const bookings = await prisma.booking.findMany({
    where: { ownerId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      pickupCity: true,
      dropCity: true,
      goodsType: true,
      weightTons: true,
      truckType: true,
      fareEstimate: true,
      bookingDate: true,
      status: true,
      createdAt: true,
      customerName: true,
      customerEmail: true,
      customerPhone: true,
    },
  });

  return NextResponse.json({ bookings });
}
