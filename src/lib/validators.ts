import { z } from "zod";
import { TRUCKS } from "@/lib/fare";
import {
  INVALID_MOBILE_MESSAGE,
  isValidIndianMobile,
  normalizeIndianMobile,
} from "@/lib/phone";

export const otpSendSchema = z.object({
  phone: z
    .string()
    .trim()
    .min(1, "Mobile number is required")
    .transform(normalizeIndianMobile)
    .refine(isValidIndianMobile, { message: INVALID_MOBILE_MESSAGE }),
});

export const TruckTypeEnum = z.enum(["MEDIUM", "HEAVY", "TRAILER"]);
export const GoodsTypeEnum = z.enum([
  "CONSTRUCTION",
  "MACHINERY",
  "STEEL",
  "CEMENT",
  "AUTOMOBILE",
  "CONTAINER",
  "AGRICULTURE",
  "OTHER",
]);
export const BookingStatusEnum = z.enum([
  "PENDING",
  "AWAITING_OWNER",
  "CONFIRMED",
  "DECLINED",
  "CANCELLED",
]);

export const ownerBookingRespondSchema = z.object({
  action: z.enum(["accept", "decline"]),
});

/** Treat "", null, and missing as null for optional contact fields. */
function nullishTrimmedString() {
  return z
    .union([z.string(), z.null(), z.undefined()])
    .transform((v) => {
      if (v == null) return null;
      const t = String(v).trim();
      return t === "" ? null : t;
    });
}

export const bookingCreateSchema = z
  .object({
    pickupCity: z.string().trim().min(2, "Pickup city is required"),
    dropCity: z.string().trim().min(2, "Drop city is required"),
    goodsType: GoodsTypeEnum,
    weightTons: z
      .number({ invalid_type_error: "Weight must be a number" })
      .finite("Weight must be a valid number")
      .min(1, "Weight must be at least 1 ton"),
    truckType: TruckTypeEnum,
    bookingDate: z.coerce.date({
      invalid_type_error: "Invalid booking date",
    }),
    customerName: z.string().trim().min(2, "Your name is required"),
    customerEmail: z.string().trim().email("A valid email is required"),
    customerPhone: z
      .string()
      .trim()
      .min(1, "Mobile number is required")
      .transform(normalizeIndianMobile)
      .refine(isValidIndianMobile, { message: INVALID_MOBILE_MESSAGE }),
    ownerId: z.preprocess(
      (v) => (v === "" ? null : v),
      z.string().cuid().optional().nullable()
    ),
  })
  .superRefine((data, ctx) => {
    const meta = TRUCKS[data.truckType];
    if (data.weightTons < meta.minTons || data.weightTons > meta.maxTons) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${meta.label} truck supports ${meta.minTons}–${meta.maxTons} tons`,
        path: ["weightTons"],
      });
    }
  });

export type BookingCreateInput = z.infer<typeof bookingCreateSchema>;

export const bookingUpdateSchema = z
  .object({
    status: BookingStatusEnum.optional(),
    ownerId: z.preprocess(
      (v) => (v === "" ? null : v),
      z.string().cuid().optional().nullable()
    ),
  })
  .refine((data) => "status" in data || "ownerId" in data, {
    message: "Provide at least one of: status, ownerId",
    path: [],
  });

export const ownerCreateSchema = z.object({
  name: z.string().trim().min(2),
  company: z.string().trim().min(2),
  phone: z.string().trim().min(7),
  email: z.string().email(),
  baseCity: z.string().trim().min(2),
  fleet: z.number().int().min(1),
  rating: z.number().min(0).max(5).default(4.5),
  specializations: z.array(z.string().trim().min(1)).default([]),
  truckTypes: z.array(TruckTypeEnum).min(1, "At least one truck type required"),
});

export const ownerUpdateSchema = ownerCreateSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Provide at least one field to update",
    path: [],
  });

export const ownerListQuerySchema = z.object({
  city: z.string().trim().min(1).optional(),
  truckType: TruckTypeEnum.optional(),
});

export const bookingHistoryQuerySchema = z
  .object({
    email: z.string().trim().email().optional(),
    ids: z
      .string()
      .optional()
      .transform((s) =>
        s
          ? s
              .split(",")
              .map((id) => id.trim())
              .filter(Boolean)
          : []
      )
      .pipe(z.array(z.string().cuid()).max(30)),
  })
  .refine((d) => (d.email && d.email.length > 0) || d.ids.length > 0, {
    message: "Provide email or booking ids",
    path: ["email"],
  });
