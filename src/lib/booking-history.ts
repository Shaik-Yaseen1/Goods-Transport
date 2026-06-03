const STORAGE_KEY = "heavyhulk-booking-history";
const MAX_IDS = 30;

export type StoredBookingHistory = {
  email: string;
  bookingIds: string[];
};

export function loadBookingHistory(): StoredBookingHistory | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as StoredBookingHistory;
    if (!data?.email || !Array.isArray(data.bookingIds)) return null;
    return data;
  } catch {
    return null;
  }
}

export function saveBookingToHistory(email: string, bookingId: string) {
  saveBookingsToHistory(email, [bookingId]);
}

export function saveBookingsToHistory(email: string, bookingIds: string[]) {
  if (typeof window === "undefined" || bookingIds.length === 0) return;
  const normalized = email.trim().toLowerCase();
  const existing = loadBookingHistory();
  const merged =
    existing?.email === normalized
      ? [...bookingIds, ...existing.bookingIds]
      : [...bookingIds];
  const unique = [...new Set(merged)];
  const payload: StoredBookingHistory = {
    email: normalized,
    bookingIds: unique.slice(0, MAX_IDS),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export function clearBookingHistory() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
