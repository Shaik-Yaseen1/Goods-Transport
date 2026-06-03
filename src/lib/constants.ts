import type { GoodsType } from "@prisma/client";

export const GOODS_OPTIONS: { value: GoodsType; label: string }[] = [
  { value: "CONSTRUCTION", label: "Construction materials" },
  { value: "MACHINERY", label: "Industrial machinery" },
  { value: "STEEL", label: "Steel & metal" },
  { value: "CEMENT", label: "Cement" },
  { value: "AUTOMOBILE", label: "Automobile / parts" },
  { value: "CONTAINER", label: "Containers" },
  { value: "AGRICULTURE", label: "Agriculture produce" },
  { value: "OTHER", label: "Other" },
];

export const POPULAR_CITIES = [
  "Ahmedabad",
  "Bengaluru",
  "Chennai",
  "Delhi",
  "Hyderabad",
  "Indore",
  "Jaipur",
  "Kadapa",
  "Kolkata",
  "Mumbai",
  "Nagpur",
  "Pune",
  "Surat",
].sort((a, b) => a.localeCompare(b, "en-IN", { sensitivity: "base" }));
