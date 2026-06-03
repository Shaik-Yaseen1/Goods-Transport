import type {
  Booking,
  BookingStatus,
  GoodsType,
  Owner,
  TruckType,
} from "@prisma/client";

const DEMO_OWNER_ID = "demo-owner-rajesh";
const DEMO_ADMIN_ID = "demo-admin";

const now = () => new Date();

function seedOwner(): Owner {
  return {
    id: DEMO_OWNER_ID,
    name: "Rajesh Kulkarni",
    company: "Sahyadri Logistics Pvt. Ltd.",
    phone: "+91 98203 41122",
    email: "rajesh@sahyadrilogistics.in",
    passwordHash: null,
    baseCity: "Mumbai",
    fleet: 42,
    rating: 4.8,
    specializations: ["Containers", "Port Drayage", "Steel Coils"],
    truckTypes: ["HEAVY", "TRAILER"] as TruckType[],
    createdAt: now(),
  };
}

type DemoState = {
  owners: Owner[];
  bookings: Booking[];
};

const globalForDemo = globalThis as unknown as { demoState?: DemoState };

function getState(): DemoState {
  if (!globalForDemo.demoState) {
    globalForDemo.demoState = { owners: [seedOwner()], bookings: [] };
  }
  return globalForDemo.demoState;
}

export function demoAdminId() {
  return DEMO_ADMIN_ID;
}

export function demoOwnerPassword() {
  return process.env.OWNER_PASSWORD ?? "1234";
}

export function demoAdminCredentials() {
  return {
    email: (process.env.ADMIN_EMAIL ?? "admin@heavyhulk.in").toLowerCase(),
    password: process.env.ADMIN_PASSWORD ?? "ChangeMe!2026",
  };
}

export function listDemoOwners(filters?: {
  city?: string;
  truckType?: TruckType;
}): Owner[] {
  let owners = [...getState().owners];
  if (filters?.city) {
    const city = filters.city.toLowerCase();
    owners = owners.filter((o) => o.baseCity.toLowerCase() === city);
  }
  if (filters?.truckType) {
    owners = owners.filter((o) => o.truckTypes.includes(filters.truckType!));
  }
  return owners.sort(
    (a, b) => b.rating - a.rating || a.name.localeCompare(b.name)
  );
}

export function findDemoOwnerById(id: string): Owner | null {
  return getState().owners.find((o) => o.id === id) ?? null;
}

export function findDemoOwnerByEmail(email: string): Owner | null {
  const needle = email.toLowerCase();
  return getState().owners.find((o) => o.email.toLowerCase() === needle) ?? null;
}

export function countDemoOwners() {
  return getState().owners.length;
}

export function countDemoBookings() {
  return getState().bookings.length;
}

export function demoOwnerCities() {
  return [...new Set(getState().owners.map((o) => o.baseCity))].map((baseCity) => ({
    baseCity,
  }));
}

export function createDemoOwner(
  data: Omit<Owner, "id" | "createdAt" | "passwordHash" | "rating"> & {
    rating?: number;
  }
): Owner {
  const owner: Owner = {
    ...data,
    id: `demo-owner-${Date.now()}`,
    passwordHash: null,
    rating: data.rating ?? 4.5,
    createdAt: now(),
  };
  getState().owners.unshift(owner);
  return owner;
}

export function updateDemoOwner(id: string, patch: Partial<Owner>): Owner | null {
  const state = getState();
  const idx = state.owners.findIndex((o) => o.id === id);
  if (idx === -1) return null;
  state.owners[idx] = { ...state.owners[idx], ...patch };
  return state.owners[idx];
}

export function deleteDemoOwner(id: string): boolean {
  const state = getState();
  const before = state.owners.length;
  state.owners = state.owners.filter((o) => o.id !== id);
  state.bookings = state.bookings.map((b) =>
    b.ownerId === id ? { ...b, ownerId: null } : b
  );
  return state.owners.length < before;
}

export function listDemoBookings(options?: {
  ownerId?: string;
  order?: "desc" | "asc";
}) {
  let bookings = [...getState().bookings];
  if (options?.ownerId) {
    bookings = bookings.filter((b) => b.ownerId === options.ownerId);
  }
  bookings.sort((a, b) => {
    const diff = b.createdAt.getTime() - a.createdAt.getTime();
    return options?.order === "asc" ? -diff : diff;
  });
  return bookings;
}

export function findDemoBookingById(id: string): Booking | null {
  return getState().bookings.find((b) => b.id === id) ?? null;
}

export function findDemoBookingsByIds(ids: string[]) {
  const set = new Set(ids);
  return getState().bookings.filter((b) => set.has(b.id));
}

export function findDemoBookingsByEmail(email: string) {
  const needle = email.toLowerCase();
  return getState().bookings
    .filter((b) => b.customerEmail?.toLowerCase() === needle)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 50);
}

export function createDemoBooking(input: {
  pickupCity: string;
  dropCity: string;
  goodsType: GoodsType;
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
}): Booking {
  const booking: Booking = {
    id: `demo-booking-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: now(),
    ...input,
    ownerId: input.ownerId ?? null,
    userId: input.userId ?? null,
    notes: input.notes ?? null,
    customerName: input.customerName ?? null,
    customerEmail: input.customerEmail ?? null,
    customerPhone: input.customerPhone ?? null,
  };
  getState().bookings.unshift(booking);
  return booking;
}

export function updateDemoBooking(
  id: string,
  patch: Partial<Booking>
): Booking | null {
  const state = getState();
  const idx = state.bookings.findIndex((b) => b.id === id);
  if (idx === -1) return null;
  state.bookings[idx] = { ...state.bookings[idx], ...patch };
  return state.bookings[idx];
}

export function deleteDemoBooking(id: string): boolean {
  const state = getState();
  const before = state.bookings.length;
  state.bookings = state.bookings.filter((b) => b.id !== id);
  return state.bookings.length < before;
}

export function demoBookingStats() {
  const stats = new Map<
    BookingStatus,
    { count: number; fareSum: number }
  >();
  for (const b of getState().bookings) {
    const row = stats.get(b.status) ?? { count: 0, fareSum: 0 };
    row.count += 1;
    row.fareSum += b.fareEstimate;
    stats.set(b.status, row);
  }
  return [...stats.entries()].map(([status, { count, fareSum }]) => ({
    status,
    _count: { _all: count },
    _sum: { fareEstimate: fareSum },
  }));
}
