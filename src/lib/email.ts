import nodemailer, { type Transporter } from "nodemailer";
import { formatINR } from "@/lib/fare";

let cached: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (cached) return cached;
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) {
    return null;
  }
  cached = nodemailer.createTransport({
    host,
    port,
    secure: process.env.SMTP_SECURE === "true" || port === 465,
    auth: { user, pass },
  });
  return cached;
}

type ConfirmationPayload = {
  to: string;
  bookingId: string;
  pickupCity: string;
  dropCity: string;
  truckType: string;
  weightTons: number;
  distanceKm: number;
  fareEstimate: number;
  bookingDate: Date;
  customerName?: string | null;
  awaitingOwner?: boolean;
  ownerName?: string | null;
};

export async function sendBookingConfirmation(payload: ConfirmationPayload) {
  const transporter = getTransporter();
  const from = process.env.SMTP_FROM ?? "Heavy Hulk <no-reply@heavyhulk.in>";
  const subject = `Heavy Hulk booking #${payload.bookingId.slice(-6).toUpperCase()} received`;
  const text = renderText(payload);
  const html = renderHtml(payload);

  if (!transporter) {
    console.warn(
      "[email] SMTP not configured — skipping send. Payload preview:\n" + text
    );
    return { ok: false, skipped: true as const };
  }

  try {
    const info = await transporter.sendMail({
      from,
      to: payload.to,
      subject,
      text,
      html,
    });
    return { ok: true, id: info.messageId };
  } catch (err) {
    console.error("[email] send failed", err);
    return { ok: false, error: (err as Error).message };
  }
}

function renderText(p: ConfirmationPayload) {
  return [
    `Hi ${p.customerName ?? "there"},`,
    "",
    `Your Heavy Hulk booking request has been received. Here are the details:`,
    "",
    `Booking ID:  ${p.bookingId}`,
    `Route:       ${p.pickupCity} → ${p.dropCity}`,
    `Truck:       ${p.truckType}`,
    `Load:        ${p.weightTons} tons`,
    `Distance:    ${p.distanceKm} km`,
    `Schedule:    ${p.bookingDate.toDateString()}`,
    `Estimate:    ${formatINR(p.fareEstimate)}`,
    "",
    p.awaitingOwner && p.ownerName
      ? `${p.ownerName} will review your request and accept or decline shortly.`
      : `We’ll assign a verified owner and confirm shortly.`,
    "",
    `— Heavy Hulk`,
  ].join("\n");
}

function renderHtml(p: ConfirmationPayload) {
  return `
  <div style="background:#0d0f14;padding:32px;font-family:Inter,Arial,sans-serif;color:#E7ECF3">
    <div style="max-width:560px;margin:0 auto;background:#171B24;border:1px solid #222836;border-radius:16px;overflow:hidden">
      <div style="padding:20px 24px;border-bottom:1px solid #222836;display:flex;align-items:center;gap:10px">
        <div style="width:30px;height:30px;border-radius:8px;background:#F47B1A;display:flex;align-items:center;justify-content:center;color:#0D0F14;font-weight:800">H</div>
        <div style="font-weight:700;letter-spacing:1px">HEAVYHAUL</div>
      </div>
      <div style="padding:24px">
        <h2 style="margin:0 0 6px;font-size:22px">Booking received</h2>
        <p style="margin:0 0 18px;color:#9AA3B2;font-size:14px">
          Hi ${p.customerName ?? "there"}, your booking request is in. ${
            p.awaitingOwner && p.ownerName
              ? `<strong>${p.ownerName}</strong> will accept or decline shortly.`
              : "We’ll assign a verified fleet owner and confirm shortly."
          }
        </p>
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          ${row("Booking ID", p.bookingId)}
          ${row("Route", `${p.pickupCity} → ${p.dropCity}`)}
          ${row("Truck", p.truckType)}
          ${row("Load", `${p.weightTons} tons`)}
          ${row("Distance", `${p.distanceKm} km`)}
          ${row("Date", p.bookingDate.toDateString())}
          ${row("Estimate", `<strong style="color:#F47B1A">${formatINR(p.fareEstimate)}</strong>`)}
        </table>
      </div>
      <div style="padding:14px 24px;border-top:1px solid #222836;color:#6B7382;font-size:12px">
        This is an automated confirmation from Heavy Hulk.
      </div>
    </div>
  </div>`;
}

type OwnerRequestPayload = {
  to: string;
  ownerName: string;
  bookingId: string;
  pickupCity: string;
  dropCity: string;
  truckType: string;
  weightTons: number;
  fareEstimate: number;
  bookingDate: Date;
  customerName?: string | null;
  customerEmail: string;
  customerPhone?: string | null;
  portalUrl: string;
};

export async function sendOwnerBookingRequest(payload: OwnerRequestPayload) {
  const transporter = getTransporter();
  const from = process.env.SMTP_FROM ?? "Heavy Hulk <no-reply@heavyhulk.in>";
  const ref = payload.bookingId.slice(-6).toUpperCase();
  const subject = `New booking request #${ref} — action required`;
  const text = [
    `Hi ${payload.ownerName},`,
    "",
    `A customer requested a truck on Heavy Hulk. Please accept or decline in your portal.`,
    "",
    `Portal: ${payload.portalUrl}`,
    "",
    `Booking: #${ref}`,
    `Route: ${payload.pickupCity} → ${payload.dropCity}`,
    `Truck: ${payload.truckType}`,
    `Load: ${payload.weightTons} tons`,
    `Date: ${payload.bookingDate.toDateString()}`,
    `Estimate: ${formatINR(payload.fareEstimate)}`,
    "",
    `Customer: ${payload.customerName ?? "—"}`,
    `Email: ${payload.customerEmail}`,
    `Phone: ${payload.customerPhone ?? "—"}`,
    "",
    `— Heavy Hulk`,
  ].join("\n");

  if (!transporter) {
    console.warn("[email] SMTP not configured — owner request preview:\n" + text);
    return { ok: false, skipped: true as const };
  }

  try {
    const info = await transporter.sendMail({
      from,
      to: payload.to,
      subject,
      text,
      html: `<p>Hi ${payload.ownerName},</p><p>New booking <strong>#${ref}</strong>: ${payload.pickupCity} → ${payload.dropCity}.</p><p><a href="${payload.portalUrl}">Open owner portal</a> to accept or decline.</p><p>Customer: ${payload.customerName ?? "—"} · ${payload.customerEmail} · ${payload.customerPhone ?? "—"}</p>`,
    });
    return { ok: true, id: info.messageId };
  } catch (err) {
    console.error("[email] owner request failed", err);
    return { ok: false, error: (err as Error).message };
  }
}

export async function sendCustomerOwnerDecision(payload: {
  to: string;
  customerName?: string | null;
  bookingId: string;
  pickupCity: string;
  dropCity: string;
  accepted: boolean;
  ownerName: string;
}) {
  const transporter = getTransporter();
  const from = process.env.SMTP_FROM ?? "Heavy Hulk <no-reply@heavyhulk.in>";
  const ref = payload.bookingId.slice(-6).toUpperCase();
  const subject = payload.accepted
    ? `Booking #${ref} confirmed by ${payload.ownerName}`
    : `Booking #${ref} declined by fleet owner`;
  const text = payload.accepted
    ? `Hi ${payload.customerName ?? "there"},\n\nYour trip ${payload.pickupCity} → ${payload.dropCity} was accepted by ${payload.ownerName}.\n\n— Heavy Hulk`
    : `Hi ${payload.customerName ?? "there"},\n\nYour trip ${payload.pickupCity} → ${payload.dropCity} was declined. Try another owner or contact support.\n\n— Heavy Hulk`;

  if (!transporter) {
    console.warn("[email] SMTP not configured — customer decision preview:\n" + text);
    return { ok: false, skipped: true as const };
  }

  try {
    await transporter.sendMail({ from, to: payload.to, subject, text });
    return { ok: true };
  } catch (err) {
    console.error("[email] customer decision failed", err);
    return { ok: false, error: (err as Error).message };
  }
}

function row(label: string, value: string) {
  return `
    <tr>
      <td style="padding:8px 0;color:#9AA3B2;width:120px">${label}</td>
      <td style="padding:8px 0">${value}</td>
    </tr>
  `;
}
