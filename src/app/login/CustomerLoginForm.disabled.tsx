/**
 * Customer mobile OTP login — DISABLED (kept for re-enable later).
 * Wire back in src/app/login/page.tsx when customer auth is turned on.
 */
"use client";

import { Suspense, useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  formatIndianMobile,
  getIndianMobileError,
  normalizeIndianMobile,
} from "@/lib/phone";
import PhoneInput from "@/components/PhoneInput";

const OTP_LENGTH = 6;
const RESEND_COOLDOWN_SEC = 30;

type Step = "phone" | "otp";

export default function CustomerLoginPageDisabled() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") || "/book";

  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  function startResendCooldown() {
    setResendCooldown(RESEND_COOLDOWN_SEC);
  }

  async function requestOtp() {
    const err = getIndianMobileError(phone);
    if (err) {
      setPhoneError(err);
      return false;
    }
    setPhoneError(null);

    const mobile = normalizeIndianMobile(phone);
    setBusy(true);
    setDevOtpHint(null);
    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: mobile }),
      });
      const data = await res.json();
      if (!res.ok) {
        const issue = data.issues?.phone?.[0];
        if (issue) {
          setPhoneError(issue);
          return false;
        }
        throw new Error(data.error || "Could not send OTP");
      }

      setPhone(mobile);
      setStep("otp");
      setOtp("");
      startResendCooldown();
      if (data.devOtp) {
        setDevOtpHint(String(data.devOtp));
        if (data.smsError) {
          toast.error(String(data.smsError), { duration: 10000 });
        } else {
          toast.message(`Use the code shown below: ${data.devOtp}`, {
            duration: 12000,
          });
        }
      } else {
        toast.success(data.message ?? "OTP sent to your mobile.");
      }
      return true;
    } catch (err) {
      const msg = (err as Error).message;
      if (msg.toLowerCase().includes("invalid") || msg.toLowerCase().includes("mobile")) {
        setPhoneError(msg);
      } else {
        toast.error(msg);
      }
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function sendOtp(e: React.FormEvent) {
    e.preventDefault();
    await requestOtp();
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault();
    const code = otp.trim();
    if (code.length < OTP_LENGTH) {
      toast.error(`Enter the ${OTP_LENGTH}-digit OTP.`);
      return;
    }

    setBusy(true);
    const res = await signIn("phone-otp", {
      phone,
      code,
      redirect: false,
      callbackUrl,
    });
    setBusy(false);

    if (!res || res.error) {
      toast.error("Invalid or expired OTP. Request a new code.");
      return;
    }

    toast.success("You’re signed in.");
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <section className="bg-hero">
      <div className="container-page grid min-h-[80vh] place-items-center py-14">
        {step === "phone" ? (
          <form onSubmit={sendOtp} className="card w-full max-w-md p-8">
            <span className="heading-eyebrow">Sign in</span>
            <h1 className="mt-3 font-head text-3xl font-extrabold uppercase">
              Mobile verification
            </h1>
            <div className="mt-6">
              <label className="label">Mobile number</label>
              <PhoneInput
                required
                value={phone}
                onChange={(v) => {
                  setPhone(v);
                  if (phoneError) setPhoneError(null);
                }}
                onBlur={() => {
                  if (phone.trim()) setPhoneError(getIndianMobileError(phone));
                }}
                error={!!phoneError}
                aria-invalid={!!phoneError}
                aria-describedby={phoneError ? "phone-error" : undefined}
              />
              {phoneError && (
                <p id="phone-error" className="mt-2 text-sm text-rose-300" role="alert">
                  {phoneError}
                </p>
              )}
            </div>
            <button className="btn-primary mt-6 w-full" disabled={busy}>
              {busy ? "Sending…" : "Send OTP"}
            </button>
          </form>
        ) : (
          <form onSubmit={verifyOtp} className="card w-full max-w-md p-8">
            <span className="heading-eyebrow">Verify</span>
            <h1 className="mt-3 font-head text-3xl font-extrabold uppercase">
              Enter OTP
            </h1>
            <p className="mt-1 text-sm text-ink-mute">
              {devOtpHint ? (
                <>
                  SMS is not set up yet — use the code below to sign in (not sent to{" "}
                  {formatIndianMobile(phone)}).
                </>
              ) : (
                <>
                  Enter the code sent to{" "}
                  <span className="font-medium text-ink">
                    {formatIndianMobile(phone)}
                  </span>
                </>
              )}
            </p>
            {devOtpHint && (
              <div className="mt-4 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-amber-200">
                  Your OTP (development)
                </p>
                <p className="mt-2 font-mono text-3xl font-bold tracking-widest text-amber-100">
                  {devOtpHint}
                </p>
              </div>
            )}

            <div className="mt-6">
              <label className="label">{OTP_LENGTH}-digit OTP</label>
              <input
                type="text"
                required
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={OTP_LENGTH}
                className="input text-center font-mono text-2xl tracking-[0.4em]"
                placeholder="••••••"
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value.replace(/\D/g, "").slice(0, OTP_LENGTH))
                }
                autoComplete="one-time-code"
              />
            </div>
            <button className="btn-primary mt-6 w-full" disabled={busy}>
              {busy ? "Verifying…" : "Verify & continue"}
            </button>
            <button
              type="button"
              className="btn-ghost mt-3 w-full text-sm disabled:opacity-50"
              disabled={busy || resendCooldown > 0}
              onClick={() => void requestOtp()}
            >
              {busy
                ? "Sending…"
                : resendCooldown > 0
                  ? `Resend OTP in ${resendCooldown}s`
                  : "Resend OTP"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
