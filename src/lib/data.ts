import type {
  Booking,
  BookingStatus,
  Owner,
  Prisma,
  TruckType,
} from "@prisma/client";
import { isDemoDataMode } from "@/lib/db-config";
import {
  countDemoBookings,
  countDemoOwners,
  createDemoBooking,
  createDemoOwner,
  deleteDemoBooking,
  deleteDemoOwner,
  demoBookingStats,
  demoOwnerCities,
  findDemoBookingById,
  findDemoBookingsByEmail,
  findDemoBookingsByIds,
  findDemoOwnerByEmail,
  findDemoOwnerById,
  listDemoBookings,
  listDemoOwners,
  updateDemoBooking,
  updateDemoOwner,
} from "@/lib/demo-store";
import { prisma } from "@/lib/prisma";

export { isDemoDataMode } from "@/lib/db-config";

export async function getHomeStats() {
  if (isDemoDataMode()) {
    return {
      ownerCount: countDemoOwners(),
      bookingCount: countDemoBookings(),
      cities: demoOwnerCities(),
    };
  }
  const [ownerCount, bookingCount, cities] = await Promise.all([
    prisma.owner.count(),
    prisma.booking.count(),
    prisma.owner.findMany({
      distinct: ["baseCity"],
      select: { baseCity: true },
    }),
  ]);
  return { ownerCount, bookingCount, cities };
}

export async function listOwners(filters?: {
  city?: string;
  truckType?: TruckType;
}) {
  if (isDemoDataMode()) {
    return listDemoOwners(filters);
  }
  const where: Prisma.OwnerWhereInput = {};
  if (filters?.city) {
    where.baseCity = { equals: filters.city, mode: "insensitive" };
  }
  if (filters?.truckType) {
    where.truckTypes = { has: filters.truckType };
  }
  return prisma.owner.findMany({
    where,
    orderBy: [{ rating: "desc" }, { name: "asc" }],
  });
}

export async function listOwnerCities() {
  if (isDemoDataMode()) {
    return demoOwnerCities();
  }
  return prisma.owner.findMany({
    distinct: ["baseCity"],
    select: { baseCity: true },
    orderBy: { baseCity: "asc" },
  });
}

export async function findOwnerById(id: string) {
  if (isDemoDataMode()) return findDemoOwnerById(id);
  return prisma.owner.findUnique({ where: { id } });
}

export async function findOwnerByEmail(email: string) {
  if (isDemoDataMode()) return findDemoOwnerByEmail(email);
  return prisma.owner.findUnique({ where: { email } });
}

export async function countOwners() {
  if (isDemoDataMode()) return countDemoOwners();
  return prisma.owner.count();
}

export async function findFirstOwner() {
  if (isDemoDataMode()) {
    const owners = listDemoOwners();
    return owners[0] ?? null;
  }
  return prisma.owner.findFirst();
}

export async function createOwner(data: Prisma.OwnerCreateInput) {
  if (isDemoDataMode()) {
    return createDemoOwner({
      name: data.name,
      company: data.company,
      phone: data.phone,
      email: data.email,
      baseCity: data.baseCity,
      fleet: data.fleet,
      rating: data.rating ?? 4.5,
      specializations: data.specializations as string[],
      truckTypes: data.truckTypes as TruckType[],
    });
  }
  return prisma.owner.create({ data });
}

export async function updateOwner(id: string, data: Prisma.OwnerUpdateInput) {
  if (isDemoDataMode()) {
    return updateDemoOwner(id, data as Partial<Owner>);
  }
  return prisma.owner.update({ where: { id }, data });
}

export async function deleteOwner(id: string) {
  if (isDemoDataMode()) return deleteDemoOwner(id);
  await prisma.owner.delete({ where: { id } });
  return true;
}

export async function findBookingById(id: string) {
  if (isDemoDataMode()) return findDemoBookingById(id);
  return prisma.booking.findUnique({ where: { id } });
}

export async function listBookingsForAdmin() {
  if (isDemoDataMode()) {
    return listDemoBookings().map((b) => ({
      ...b,
      owner: b.ownerId ? findDemoOwnerById(b.ownerId) : null,
    }));
  }
  return prisma.booking.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      owner: { select: { id: true, name: true, company: true, baseCity: true } },
    },
  });
}

export async function listOwnersForAdmin() {
  if (isDemoDataMode()) {
    return listDemoOwners().sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }
  return prisma.owner.findMany({ orderBy: { createdAt: "desc" } });
}

export async function getBookingStats() {
  if (isDemoDataMode()) return demoBookingStats();
  return prisma.booking.groupBy({
    by: ["status"],
    _count: { _all: true },
    _sum: { fareEstimate: true },
  });
}

export async function listBookingsForOwner(ownerId: string) {
  if (isDemoDataMode()) {
    return listDemoBookings({ ownerId }).map(
      ({
        id,
        pickupCity,
        dropCity,
        goodsType,
        weightTons,
        truckType,
        fareEstimate,
        bookingDate,
        status,
        createdAt,
        customerName,
        customerEmail,
        customerPhone,
      }) => ({
        id,
        pickupCity,
        dropCity,
        goodsType,
        weightTons,
        truckType,
        fareEstimate,
        bookingDate,
        status,
        createdAt,
        customerName,
        customerEmail,
        customerPhone,
      })
    );
  }
  return prisma.booking.findMany({
    where: { ownerId },
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
}

export async function findOwnerBooking(ownerId: string, bookingId: string) {
  if (isDemoDataMode()) {
    const booking = findDemoBookingById(bookingId);
    if (!booking || booking.ownerId !== ownerId) return null;
    return {
      ...booking,
      owner: findDemoOwnerById(ownerId),
    };
  }
  return prisma.booking.findFirst({
    where: { id: bookingId, ownerId },
    include: { owner: true },
  });
}

export async function createBooking(input: {
  pickupCity: string;
  dropCity: string;
  goodsType: Booking["goodsType"];
  weightTons: number;
  distanceKm: number;
  truckType: TruckType;
  fareEstimate: number;
  bookingDate: Date;
  customerName?: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;
  notes?: string | null;
  ownerId?: string | null;
  userId?: string | null;
  status: BookingStatus;
}) {
  if (isDemoDataMode()) {
    const booking = createDemoBooking(input);
    const owner = booking.ownerId ? findDemoOwnerById(booking.ownerId) : null;
    return { ...booking, owner };
  }
  return prisma.booking.create({
    data: input,
    include: { owner: true },
  });
}

export async function updateBooking(
  id: string,
  data: Prisma.BookingUpdateInput,
  includeOwner = false
) {
  if (isDemoDataMode()) {
    const updated = updateDemoBooking(id, data as Partial<Booking>);
    if (!updated) return null;
    if (!includeOwner) return updated;
    return {
      ...updated,
      owner: updated.ownerId
        ? findDemoOwnerById(updated.ownerId)
        : null,
    };
  }
  return prisma.booking.update({
    where: { id },
    data,
    include: includeOwner
      ? { owner: { select: { id: true, name: true, company: true, email: true } } }
      : undefined,
  });
}

export async function deleteBooking(id: string) {
  if (isDemoDataMode()) return deleteDemoBooking(id);
  await prisma.booking.delete({ where: { id } });
  return true;
}

export async function listBookingsByIds(ids: string[]) {
  if (isDemoDataMode()) {
    return findDemoBookingsByIds(ids).map((b) => ({
      ...b,
      owner: b.ownerId
        ? findDemoOwnerById(b.ownerId)
        : null,
    }));
  }
  return prisma.booking.findMany({
    where: { id: { in: ids } },
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
      owner: { select: { name: true, company: true } },
    },
  });
}

export async function listBookingsByEmail(email: string) {
  if (isDemoDataMode()) {
    return findDemoBookingsByEmail(email).map((b) => ({
      ...b,
      owner: b.ownerId
        ? findDemoOwnerById(b.ownerId)
        : null,
    }));
  }
  return prisma.booking.findMany({
    where: { customerEmail: { equals: email, mode: "insensitive" } },
    orderBy: { createdAt: "desc" },
    take: 50,
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
      owner: { select: { name: true, company: true } },
    },
  });
}

export async function findUserByEmail(email: string) {
  if (isDemoDataMode()) return null;
  return prisma.user.findUnique({ where: { email } });
}

export async function findOwnerWithPasswordByEmail(email: string) {
  if (isDemoDataMode()) return findDemoOwnerByEmail(email);
  return prisma.owner.findUnique({ where: { email } });
}
