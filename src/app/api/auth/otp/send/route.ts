import { NextRequest, NextResponse } from "next/server";

/* Customer OTP send — disabled. Re-enable: restore from git or CustomerLoginForm.disabled.tsx flow */

export async function POST(_req: NextRequest) {
  return NextResponse.json(
    { error: "Customer authentication is disabled." },
    { status: 503 }
  );
}

/* ORIGINAL — commented out
import { createAndStoreOtp } from "@/lib/otp";
import { sendOtpSms, shouldExposeDevOtp, SmsDeliveryError } from "@/lib/sms";
import { formatIndianMobile } from "@/lib/phone";
import { otpSendSchema } from "@/lib/validators";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  ...
}
*/
