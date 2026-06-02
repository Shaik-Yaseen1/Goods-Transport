"use client";

import clsx from "clsx";
import { normalizeIndianMobile } from "@/lib/phone";

type PhoneInputProps = {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: boolean;
  readOnly?: boolean;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  id?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
};

export default function PhoneInput({
  value,
  onChange,
  onBlur,
  error,
  readOnly,
  disabled,
  required,
  placeholder = "9876543210",
  id,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedby,
}: PhoneInputProps) {
  function handleChange(raw: string) {
    onChange(normalizeIndianMobile(raw).slice(0, 10));
  }

  return (
    <div
      className={clsx(
        "flex overflow-hidden rounded-xl border border-bg-ring bg-bg-soft transition focus-within:border-accent/60 focus-within:ring-2 focus-within:ring-accent/30",
        error && "border-rose-500/60 focus-within:border-rose-400 focus-within:ring-rose-400/20",
        (readOnly || disabled) && "opacity-80"
      )}
    >
      <span
        className="flex shrink-0 items-center border-r border-bg-ring px-3.5 text-sm font-medium text-ink-mute"
        aria-hidden
      >
        +91
      </span>
      <input
        id={id}
        type="tel"
        inputMode="numeric"
        readOnly={readOnly}
        disabled={disabled}
        required={required}
        className="min-w-0 flex-1 border-0 bg-transparent px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-dim focus:outline-none focus:ring-0"
        placeholder={placeholder}
        maxLength={10}
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={onBlur}
        autoComplete="tel"
        aria-invalid={ariaInvalid}
        aria-describedby={ariaDescribedby}
      />
    </div>
  );
}
