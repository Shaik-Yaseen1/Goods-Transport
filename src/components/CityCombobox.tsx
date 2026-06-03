"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import clsx from "clsx";

type CityComboboxProps = {
  label: string;
  value: string;
  onChange: (city: string) => void;
  cities: readonly string[];
  required?: boolean;
};

export default function CityCombobox({
  label,
  value,
  onChange,
  cities,
  required,
}: CityComboboxProps) {
  const baseId = useId();
  const listId = `${baseId}-listbox`;
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const trimmedValue = value.trim();
  const trimmedQuery = query.trim();
  const qLower = trimmedQuery.toLowerCase();

  const filtered = useMemo(() => {
    if (!qLower) return [...cities];
    return cities.filter((c) => c.toLowerCase().includes(qLower));
  }, [cities, qLower]);

  const exactCity = useMemo(
    () => cities.find((c) => c.toLowerCase() === qLower),
    [cities, qLower]
  );

  const canUseCustom =
    trimmedQuery.length >= 2 && !exactCity && filtered.length === 0;

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
  }, []);

  const pick = useCallback(
    (city: string) => {
      onChange(city);
      close();
    },
    [onChange, close]
  );

  useEffect(() => {
    if (!open) return;
    const t = requestAnimationFrame(() => searchRef.current?.focus());
    return () => cancelAnimationFrame(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) close();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  function onSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter") return;
    e.preventDefault();
    if (exactCity) {
      pick(exactCity);
      return;
    }
    if (filtered.length === 1) {
      pick(filtered[0]);
      return;
    }
    if (trimmedQuery.length >= 2 && filtered.length === 0) {
      pick(trimmedQuery);
    }
  }

  const displayLabel =
    trimmedValue.length > 0 ? trimmedValue : "Choose a city";

  return (
    <div ref={rootRef} className="relative">
      <label htmlFor={`${baseId}-trigger`} className="label">
        {label}
        {required ? <span className="text-accent"> *</span> : null}
      </label>
      <button
        type="button"
        id={`${baseId}-trigger`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() =>
          setOpen((o) => {
            const next = !o;
            if (next) setQuery("");
            return next;
          })
        }
        className={clsx(
          "input flex w-full items-center justify-between gap-2 text-left font-body",
          !trimmedValue && "text-ink-dim"
        )}
      >
        <span className="flex min-w-0 items-center gap-2">
          <span
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-accent/15 text-accent"
            aria-hidden
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
              <path
                d="M12 21s7-4.35 7-10a7 7 0 10-14 0c0 5.65 7 10 7 10z"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinejoin="round"
              />
              <circle cx="12" cy="11" r="2.25" fill="currentColor" />
            </svg>
          </span>
          <span className="truncate">{displayLabel}</span>
        </span>
        <svg
          viewBox="0 0 24 24"
          className={clsx(
            "h-4 w-4 shrink-0 text-ink-mute transition-transform",
            open && "rotate-180"
          )}
          fill="none"
          aria-hidden
        >
          <path
            d="M6 9l6 6 6-6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <div
          id={listId}
          role="listbox"
          aria-labelledby={`${baseId}-trigger`}
          className="absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-xl border border-bg-ring bg-bg-card shadow-card ring-1 ring-black/20"
        >
          <div className="border-b border-bg-ring bg-bg-soft/80 p-2">
            <input
              ref={searchRef}
              type="search"
              autoComplete="off"
              placeholder="Search hubs…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onSearchKeyDown}
              className="input py-2 text-sm"
              aria-label={`Search ${label}`}
            />
          </div>
          <ul className="max-h-52 overflow-y-auto py-1">
            {filtered.map((city) => {
              const selected =
                trimmedValue.toLowerCase() === city.toLowerCase();
              return (
                <li key={city} role="presentation">
                  <button
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => pick(city)}
                    className={clsx(
                      "flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm transition",
                      selected
                        ? "bg-accent/15 text-accent"
                        : "text-ink hover:bg-bg-soft"
                    )}
                  >
                    <span
                      className={clsx(
                        "h-1.5 w-1.5 shrink-0 rounded-full",
                        selected ? "bg-accent" : "bg-ink-dim"
                      )}
                    />
                    {city}
                  </button>
                </li>
              );
            })}
            {filtered.length === 0 && (
              <li className="px-3 py-4 text-center text-sm text-ink-mute">
                No hub matches “{trimmedQuery}”.
                {trimmedQuery.length >= 2 ? (
                  <span className="mt-1 block text-xs text-ink-dim">
                    Press Enter to use this name as the city.
                  </span>
                ) : null}
              </li>
            )}
          </ul>
          {canUseCustom && (
            <div className="border-t border-bg-ring p-2">
              <button
                type="button"
                onClick={() => pick(trimmedQuery)}
                className="btn-ghost w-full justify-start py-2 text-xs"
              >
                Use “{trimmedQuery}” as city
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
