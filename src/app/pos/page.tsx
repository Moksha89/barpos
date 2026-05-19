import { PosBillingClient } from "@/components/pos-billing-client";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function PosPage() {
  const [categories, items, staff, offers] = await Promise.all([
    prisma.category.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
    }),
    prisma.item.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
    }),
    prisma.staff.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
    }),
    prisma.offer.findMany({
      where: { active: true },
      include: { eligibleFreeItems: { include: { item: true } } },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <main className="min-h-screen bg-stone-100 p-4 text-stone-950 sm:p-6">
      <header className="mx-auto mb-4 max-w-7xl">
        <p className="text-sm font-bold uppercase tracking-[0.25em] text-amber-700">
          POS Billing
        </p>
        <h1 className="mt-2 text-3xl font-black">Fast touch billing</h1>
        <p className="mt-2 text-stone-600">
          Add paid items, unlock configured complimentary starters, collect tips
          separately, split payment, and save invoice-ready bills.
        </p>
      </header>
      <PosBillingClient
        categories={categories}
        items={items}
        staff={staff}
        offers={offers}
      />
    </main>
  );
}
