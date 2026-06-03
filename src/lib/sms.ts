/** Send OTP SMS to the 10-digit Indian mobile the user entered (+91XXXXXXXXXX). */

export class SmsDeliveryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SmsDeliveryError";
  }
}

function otpMessage(code: string): string {
  return `Your Heavy Hulk verification code is ${code}. Valid for 10 minutes.`;
}

function toIndiaSmsMobile(phone10: string): string {
  return `91${phone10}`;
}

async function sendVia2Factor(phone10: string, code: string): Promise<void> {
  const apiKey = process.env.TWO_FACTOR_API_KEY;
  if (!apiKey) {
    throw new SmsDeliveryError("2Factor.in is not configured.");
  }

  const template = process.env.TWO_FACTOR_OTP_TEMPLATE ?? "HEAVYHULK";
  const mobile = toIndiaSmsMobile(phone10);
  const url = `https://2factor.in/API/V1/${encodeURIComponent(apiKey)}/SMS/${mobile}/${encodeURIComponent(code)}/${encodeURIComponent(template)}`;

  const res = await fetch(url, { method: "GET" });
  const data = (await res.json().catch(() => ({}))) as {
    Status?: string;
    Details?: string;
    Message?: string;
  };

  if (!res.ok || data.Status === "Error") {
    const senderId = process.env.TWO_FACTOR_SENDER_ID ?? "HVIHUL";
    const tsmsRes = await fetch(
      `https://2factor.in/API/V1/${encodeURIComponent(apiKey)}/ADDON_SERVICES/SEND/TSMS`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          From: senderId.slice(0, 6),
          To: mobile,
          Msg: otpMessage(code),
        }),
      }
    );
    const tsms = (await tsmsRes.json().catch(() => ({}))) as {
      Status?: string;
      Details?: string;
    };
    if (!tsmsRes.ok || tsms.Status === "Error") {
      console.error("[sms] 2Factor error", data, tsms);
      throw new SmsDeliveryError(
        data.Details ||
          data.Message ||
          tsms.Details ||
          "Could not send OTP. Check TWO_FACTOR_API_KEY and template in .env."
      );
    }
  }
}

type Fast2SmsResponse = {
  return?: boolean;
  status_code?: number;
  message?: string | string[];
};

const FAST2SMS_HINTS: Record<number, string> = {
  996: "Complete website verification in Fast2SMS → OTP Message menu, or set FAST2SMS_ROUTE=q in .env.",
  999: "Recharge your Fast2SMS wallet with at least ₹100 (one-time requirement) before the API works.",
};

function fast2SmsErrorText(data: Fast2SmsResponse): string {
  const msg = data.message;
  const base = Array.isArray(msg) ? msg.join(", ") : msg || "Fast2SMS request failed";
  const hint = data.status_code ? FAST2SMS_HINTS[data.status_code] : undefined;
  return hint ? `${base} ${hint}` : base;
}

function needsOtpWebsiteVerification(data: Fast2SmsResponse): boolean {
  const msg = data.message;
  const text = (Array.isArray(msg) ? msg.join(", ") : msg || "").toLowerCase();
  return data.status_code === 996 || text.includes("website verification");
}

async function postFast2Sms(
  apiKey: string,
  body: Record<string, unknown>
): Promise<{ ok: boolean; data: Fast2SmsResponse }> {
  const res = await fetch("https://www.fast2sms.com/dev/bulkV2", {
    method: "POST",
    headers: {
      authorization: apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = (await res.json().catch(() => ({}))) as Fast2SmsResponse;
  const ok = res.ok && data.return !== false;
  return { ok, data };
}

async function postFast2SmsDlt(
  apiKey: string,
  body: Record<string, unknown>
): Promise<{ ok: boolean; data: Fast2SmsResponse }> {
  const res = await fetch("https://www.fast2sms.com/dev/custom", {
    method: "POST",
    headers: {
      authorization: apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = (await res.json().catch(() => ({}))) as Fast2SmsResponse;
  const ok = res.ok && data.return !== false;
  return { ok, data };
}

async function sendViaFast2Sms(phone10: string, code: string): Promise<void> {
  const apiKey = process.env.FAST2SMS_API_KEY;
  if (!apiKey) {
    throw new SmsDeliveryError("Fast2SMS is not configured.");
  }

  const route = (process.env.FAST2SMS_ROUTE ?? "auto").toLowerCase();
  const message = otpMessage(code);

  if (route === "dlt") {
    const senderId = process.env.FAST2SMS_DLT_SENDER_ID;
    const messageId = process.env.FAST2SMS_DLT_MESSAGE_ID;
    if (!senderId || !messageId) {
      throw new SmsDeliveryError(
        "Set FAST2SMS_DLT_SENDER_ID and FAST2SMS_DLT_MESSAGE_ID in .env (from Fast2SMS DLT Manager)."
      );
    }
    const { ok, data } = await postFast2SmsDlt(apiKey, {
      route: "dlt",
      requests: [
        {
          sender_id: senderId,
          message: Number(messageId),
          variables_values: code,
          numbers: phone10,
        },
      ],
    });
    if (!ok) {
      console.error("[sms] Fast2SMS DLT error", data);
      throw new SmsDeliveryError(fast2SmsErrorText(data));
    }
    return;
  }

  if (route === "q") {
    const { ok, data } = await postFast2Sms(apiKey, {
      route: "q",
      message,
      numbers: phone10,
    });
    if (!ok) {
      console.error("[sms] Fast2SMS Quick SMS error", data);
      throw new SmsDeliveryError(fast2SmsErrorText(data));
    }
    return;
  }

  // route "otp" or "auto": try OTP API first
  const otpAttempt = await postFast2Sms(apiKey, {
    route: "otp",
    variables_values: code,
    numbers: phone10,
  });

  if (otpAttempt.ok) return;

  const tryQuick =
    route === "auto" && needsOtpWebsiteVerification(otpAttempt.data);

  if (tryQuick) {
    console.warn(
      "[sms] Fast2SMS OTP needs website verification — trying Quick SMS (route q)"
    );
    const quickAttempt = await postFast2Sms(apiKey, {
      route: "q",
      message,
      numbers: phone10,
    });
    if (quickAttempt.ok) return;

    console.error("[sms] Fast2SMS Quick SMS error", quickAttempt.data);
    throw new SmsDeliveryError(
      `${fast2SmsErrorText(quickAttempt.data)}. For OTP route, complete website verification in Fast2SMS → OTP Message menu.`
    );
  }

  console.error("[sms] Fast2SMS OTP error", otpAttempt.data);
  const errText = fast2SmsErrorText(otpAttempt.data);
  if (needsOtpWebsiteVerification(otpAttempt.data)) {
    throw new SmsDeliveryError(
      `${errText} In Fast2SMS dashboard: OTP Message → complete website verification, or set FAST2SMS_ROUTE=q in .env, or use DLT (FAST2SMS_ROUTE=dlt).`
    );
  }
  throw new SmsDeliveryError(errText);
}

async function sendViaTwilio(phone10: string, message: string): Promise<void> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER;
  if (!sid || !token || !from) {
    throw new SmsDeliveryError("Twilio is not fully configured.");
  }

  const auth = Buffer.from(`${sid}:${token}`).toString("base64");
  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: `+91${phone10}`,
        From: from,
        Body: message,
      }),
    }
  );

  if (!res.ok) {
    console.error("[sms] Twilio error", res.status, await res.text());
    throw new SmsDeliveryError("Could not send OTP to your mobile. Try again shortly.");
  }
}

async function sendViaMsg91(phone10: string, code: string): Promise<void> {
  const authkey = process.env.MSG91_AUTH_KEY;
  const templateId = process.env.MSG91_TEMPLATE_ID;
  if (!authkey || !templateId) {
    throw new SmsDeliveryError("MSG91 is not fully configured.");
  }

  const res = await fetch("https://control.msg91.com/api/v5/otp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      authkey,
    },
    body: JSON.stringify({
      template_id: templateId,
      mobile: toIndiaSmsMobile(phone10),
      otp: code,
    }),
  });

  const data = (await res.json().catch(() => ({}))) as { type?: string; message?: string };
  if (!res.ok || data.type === "error") {
    console.error("[sms] MSG91 error", res.status, data);
    throw new SmsDeliveryError(
      data.message || "Could not send OTP to your mobile. Try again shortly."
    );
  }
}

async function sendViaWebhook(phone10: string, message: string): Promise<void> {
  const url = process.env.SMS_WEBHOOK_URL;
  if (!url) {
    throw new SmsDeliveryError("SMS webhook is not configured.");
  }

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      phone: toIndiaSmsMobile(phone10),
      to: `+91${phone10}`,
      message,
    }),
  });

  if (!res.ok) {
    console.error("[sms] webhook error", res.status, await res.text());
    throw new SmsDeliveryError("Could not send OTP to your mobile. Try again shortly.");
  }
}

export function smsProviderConfigured(): boolean {
  return Boolean(
    process.env.TWO_FACTOR_API_KEY ||
      process.env.FAST2SMS_API_KEY ||
      (process.env.MSG91_AUTH_KEY && process.env.MSG91_TEMPLATE_ID) ||
      (process.env.TWILIO_ACCOUNT_SID &&
        process.env.TWILIO_AUTH_TOKEN &&
        process.env.TWILIO_PHONE_NUMBER) ||
      process.env.SMS_WEBHOOK_URL
  );
}

export async function sendOtpSms(
  phone10: string,
  code: string
): Promise<{ delivered: boolean }> {
  const message = otpMessage(code);

  if (process.env.TWO_FACTOR_API_KEY) {
    await sendVia2Factor(phone10, code);
    return { delivered: true };
  }

  if (process.env.FAST2SMS_API_KEY) {
    await sendViaFast2Sms(phone10, code);
    return { delivered: true };
  }

  if (process.env.MSG91_AUTH_KEY && process.env.MSG91_TEMPLATE_ID) {
    await sendViaMsg91(phone10, code);
    return { delivered: true };
  }

  if (
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_PHONE_NUMBER
  ) {
    await sendViaTwilio(phone10, message);
    return { delivered: true };
  }

  if (process.env.SMS_WEBHOOK_URL) {
    await sendViaWebhook(phone10, message);
    return { delivered: true };
  }

  if (process.env.NODE_ENV === "production") {
    throw new SmsDeliveryError(
      "SMS is not configured on the server. Add TWO_FACTOR_API_KEY or FAST2SMS_API_KEY to .env."
    );
  }

  console.warn(
    `[sms] No SMS provider — OTP for +91 ${phone10.slice(0, 5)} ${phone10.slice(5)}: ${code}`
  );
  return { delivered: false };
}

export function shouldExposeDevOtp(): boolean {
  if (process.env.NODE_ENV === "production") return false;
  if (process.env.OTP_DEV_MODE === "true") return true;
  return !smsProviderConfigured();
}
