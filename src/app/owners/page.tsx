import OwnerCard from "@/components/OwnerCard";
import OwnerFilters from "@/components/OwnerFilters";
import { listOwnerCities, listOwners } from "@/lib/data";
import { ownerListQuerySchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Verified Fleet Owners · Heavy Hulk",
};

export default async function OwnersPage({
  searchParams,
}: {
  searchParams: { city?: string; truckType?: string };
}) {
  const parsed = ownerListQuerySchema.safeParse({
    city: searchParams.city,
    truckType: searchParams.truckType,
  });
  const filters = parsed.success ? parsed.data : {};

  const [owners, cities] = await Promise.all([
    listOwners(filters),
    listOwnerCities(),
  ]);

  return (
    <section className="bg-hero">
      <div className="container-page py-14">
        <div className="mb-8 flex flex-col gap-3">
          <span className="heading-eyebrow w-fit">Owners</span>
          <h1 className="font-head text-4xl font-extrabold uppercase tracking-tight md:text-5xl">
            Verified fleet partners across India.
          </h1>
          <p className="max-w-2xl text-ink-mute">
            Talk directly to owners or request a quote — every partner is GST + IBA
            registered with traceable fleet records.
          </p>
        </div>

        <OwnerFilters cities={cities.map((c) => c.baseCity)} />

        <div className="mt-8 mb-3 flex items-center justify-between">
          <p className="text-sm text-ink-mute">
            {owners.length} owner{owners.length === 1 ? "" : "s"}
            {filters.city ? ` in ${filters.city}` : ""}
            {filters.truckType ? ` · ${filters.truckType.toLowerCase()} trucks` : ""}
          </p>
        </div>

        {owners.length === 0 ? (
          <div className="card grid place-items-center p-14 text-center">
            <p className="font-head text-2xl uppercase">No matching owners</p>
            <p className="mt-1 text-sm text-ink-mute">
              Try a different city or truck type.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {owners.map((o) => (
              <OwnerCard key={o.id} owner={o} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
