"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import clsx from "clsx";
import type { Owner, TruckType } from "@prisma/client";
import { TRUCKS, TRUCK_ORDER } from "@/lib/fare";

type Draft = {
  id?: string;
  name: string;
  company: string;
  phone: string;
  email: string;
  baseCity: string;
  fleet: number;
  rating: number;
  specializations: string;
  truckTypes: TruckType[];
};

const empty: Draft = {
  name: "",
  company: "",
  phone: "",
  email: "",
  baseCity: "",
  fleet: 5,
  rating: 4.5,
  specializations: "",
  truckTypes: ["MEDIUM"],
};

export default function AdminOwnersPanel({ owners }: { owners: Owner[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [draft, setDraft] = useState<Draft>(empty);
  const editing = Boolean(draft.id);

  function loadForEdit(o: Owner) {
    setDraft({
      id: o.id,
      name: o.name,
      company: o.company,
      phone: o.phone,
      email: o.email,
      baseCity: o.baseCity,
      fleet: o.fleet,
      rating: o.rating,
      specializations: o.specializations.join(", "),
      truckTypes: o.truckTypes,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function reset() {
    setDraft(empty);
  }

  function toggleTruck(t: TruckType) {
    setDraft((d) =>
      d.truckTypes.includes(t)
        ? { ...d, truckTypes: d.truckTypes.filter((x) => x !== t) }
        : { ...d, truckTypes: [...d.truckTypes, t] }
    );
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const body = {
      name: draft.name.trim(),
      company: draft.company.trim(),
      phone: draft.phone.trim(),
      email: draft.email.trim().toLowerCase(),
      baseCity: draft.baseCity.trim(),
      fleet: Number(draft.fleet),
      rating: Number(draft.rating),
      specializations: draft.specializations
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      truckTypes: draft.truckTypes,
    };
    if (body.truckTypes.length === 0) {
      toast.error("Pick at least one truck type");
      return;
    }
    start(async () => {
      try {
        const url = draft.id ? `/api/owners/${draft.id}` : "/api/owners";
        const res = await fetch(url, {
          method: draft.id ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const j = await res.json();
        if (!res.ok) throw new Error(j.error || "Save failed");
        toast.success(draft.id ? "Owner updated" : "Owner created");
        reset();
        router.refresh();
      } catch (e) {
        toast.error((e as Error).message);
      }
    });
  }

  function remove(o: Owner) {
    if (!confirm(`Delete owner ${o.name}?`)) return;
    start(async () => {
      try {
        const res = await fetch(`/api/owners/${o.id}`, { method: "DELETE" });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j.error || "Delete failed");
        }
        toast.success("Owner deleted");
        if (draft.id === o.id) reset();
        router.refresh();
      } catch (e) {
        toast.error((e as Error).message);
      }
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
      <form onSubmit={submit} className="card p-6">
        <h3 className="font-head text-xl font-bold uppercase">
          {editing ? "Edit owner" : "Add owner"}
        </h3>
        <p className="mt-1 text-sm text-ink-mute">
          {editing
            ? "Update fleet partner details."
            : "Onboard a new verified fleet partner."}
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Input
            label="Name"
            value={draft.name}
            onChange={(v) => setDraft({ ...draft, name: v })}
            required
          />
          <Input
            label="Company"
            value={draft.company}
            onChange={(v) => setDraft({ ...draft, company: v })}
            required
          />
          <Input
            label="Phone"
            value={draft.phone}
            onChange={(v) => setDraft({ ...draft, phone: v })}
            required
          />
          <Input
            label="Email"
            type="email"
            value={draft.email}
            onChange={(v) => setDraft({ ...draft, email: v })}
            required
          />
          <Input
            label="Base city"
            value={draft.baseCity}
            onChange={(v) => setDraft({ ...draft, baseCity: v })}
            required
          />
          <Input
            label="Fleet size"
            type="number"
            min={1}
            value={String(draft.fleet)}
            onChange={(v) => setDraft({ ...draft, fleet: Number(v) })}
            required
          />
          <Input
            label="Rating (0–5)"
            type="number"
            step="0.1"
            min={0}
            max={5}
            value={String(draft.rating)}
            onChange={(v) => setDraft({ ...draft, rating: Number(v) })}
          />
          <Input
            label="Specializations (comma sep.)"
            value={draft.specializations}
            onChange={(v) => setDraft({ ...draft, specializations: v })}
          />
        </div>

        <div className="mt-5">
          <div className="label">Truck types</div>
          <div className="flex flex-wrap gap-2">
            {TRUCK_ORDER.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => toggleTruck(t)}
                className={clsx(
                  "chip",
                  draft.truckTypes.includes(t) && "chip-accent"
                )}
              >
                {TRUCKS[t].label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <button className="btn-primary" disabled={pending}>
            {editing ? "Save changes" : "Create owner"}
          </button>
          {editing && (
            <button type="button" onClick={reset} className="btn-ghost">
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="card overflow-hidden">
        <div className="border-b border-bg-ring px-4 py-3 text-xs font-semibold uppercase tracking-wider text-ink-mute">
          {owners.length} owners
        </div>
        <div className="divide-y divide-bg-ring">
          {owners.map((o) => (
            <div key={o.id} className="flex flex-wrap items-start justify-between gap-3 px-4 py-4">
              <div className="min-w-0">
                <div className="font-semibold text-ink">
                  {o.name}{" "}
                  <span className="text-ink-mute font-normal">· {o.company}</span>
                </div>
                <div className="mt-0.5 text-xs text-ink-dim">
                  {o.baseCity} · {o.fleet} trucks · ★ {o.rating.toFixed(1)}
                </div>
                <div className="mt-1 text-xs text-ink-mute">
                  {o.email} · {o.phone}
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {o.truckTypes.map((t) => (
                    <span key={t} className="chip-accent">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => loadForEdit(o)}
                  className="btn-ghost text-xs"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => remove(o)}
                  className="btn-danger text-xs"
                  disabled={pending}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
          {owners.length === 0 && (
            <div className="px-4 py-10 text-center text-sm text-ink-mute">
              No owners yet. Add the first one on the left.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  ...rest
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  step?: string;
  min?: number;
  max?: number;
}) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <input
        type={type}
        className="input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        {...rest}
      />
    </label>
  );
}
