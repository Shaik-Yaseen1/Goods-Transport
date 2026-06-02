/** Indian mobile: 10 digits, first digit 6–9. */
const INDIAN_MOBILE_RE = /^[6-9]\d{9}$/;

export const INVALID_MOBILE_MESSAGE = "Invalid number";

export function normalizeIndianMobile(input: string): string {
  const digits = input.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) {
    return digits.slice(2);
  }
  if (digits.length === 11 && digits.startsWith("0")) {
    return digits.slice(1);
  }
  return digits;
}

export function isValidIndianMobile(input: string): boolean {
  return getIndianMobileError(input) === null;
}

/** Returns an error message, or null if the number is valid. */
export function getIndianMobileError(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) {
    return "Mobile number is required";
  }

  const digitsOnly = trimmed.replace(/\D/g, "");
  if (digitsOnly.length === 0) {
    return INVALID_MOBILE_MESSAGE;
  }

  const normalized = normalizeIndianMobile(trimmed);

  if (normalized.length !== 10) {
    return INVALID_MOBILE_MESSAGE;
  }

  if (!INDIAN_MOBILE_RE.test(normalized)) {
    return INVALID_MOBILE_MESSAGE;
  }

  return null;
}

export function formatIndianMobile(input: string): string {
  const n = normalizeIndianMobile(input);
  if (!INDIAN_MOBILE_RE.test(n)) return input;
  return `+91 ${n.slice(0, 5)} ${n.slice(5)}`;
}
