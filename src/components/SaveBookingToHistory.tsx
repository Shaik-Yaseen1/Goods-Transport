"use client";

import { useEffect } from "react";
import { saveBookingToHistory } from "@/lib/booking-history";

export default function SaveBookingToHistory({
  bookingId,
  email,
}: {
  bookingId: string;
  email: string | null;
}) {
  useEffect(() => {
    if (bookingId && email?.trim()) {
      saveBookingToHistory(email, bookingId);
    }
  }, [bookingId, email]);

  return null;
}
