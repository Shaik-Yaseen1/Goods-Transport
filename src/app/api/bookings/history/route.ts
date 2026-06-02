import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
// import { getCustomerSession } from "@/lib/customer-auth";
import { bookingHistoryQuerySchema } from "@/lib/validators";

const bookingSelect = {
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
  owner: {
    select: { name: true, company: true },
  },
} as const;

export async function GET(req: NextRequest) {
  /* Customer login auth — disabled
  const session = await getCustomerSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in to view your bookings." }, { status: 401 });
  }
  */

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
    const byIds = await prisma.booking.findMany({
      where: { id: { in: ids } },
      orderBy: { createdAt: "desc" },
      select: bookingSelect,
    });
    return NextResponse.json({ bookings: byIds });
  }

  const bookings = await prisma.booking.findMany({
    where: {
      customerEmail: {
        equals: email!,
        mode: "insensitive",
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: bookingSelect,
  });

  return NextResponse.json({ bookings });
}
