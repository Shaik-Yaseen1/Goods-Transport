import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import OwnerBookingsPanel from "@/components/owner/OwnerBookingsPanel";
import OwnerSignOut from "@/components/owner/OwnerSignOut";

export const dynamic = "force-dynamic";

export const metadata = { title: "Owner Portal · Heavy Hulk" };

export default async function OwnerPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "OWNER" || !session.user.id) {
    redirect("/owner/login?callbackUrl=/owner");
  }

  const owner = await prisma.owner.findUnique({
    where: { id: session.user.id },
    select: { name: true, company: true, email: true, baseCity: true },
  });

  if (!owner) redirect("/owner/login");

  return (
    <section className="bg-hero">
      <div className="container-page py-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="heading-eyebrow">Fleet owner</span>
            <h1 className="mt-2 font-head text-4xl font-extrabold uppercase">
              Booking requests
            </h1>
            <p className="text-sm text-ink-mute">
              {owner.name} · {owner.company} · {owner.baseCity}
            </p>
          </div>
          <OwnerSignOut />
        </div>
        <div className="mt-8">
          <OwnerBookingsPanel />
        </div>
      </div>
    </section>
  );
}
