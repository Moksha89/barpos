import { PosBillingClient } from "@/components/pos-billing-client";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function PosPage({
  searchParams,
}: {
  searchParams: Promise<{ tableId?: string }>;
}) {
  await requirePermission("pos.create");
  const params = await searchParams;
  const [categories, items, staff, offers, table, paymentMethods] = await Promise.all([
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
    params.tableId
      ? prisma.barTable.findUnique({
          where: { id: params.tableId },
          include: {
            orders: {
              where: { status: { in: ["DRAFT", "PENDING"] } },
              include: { items: { include: { item: true } } },
              orderBy: { createdAt: "desc" },
              take: 1,
            },
          },
        })
      : null,
    prisma.paymentMethod.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
  ]);
  const tableContext = table
    ? {
        id: table.id,
        tableName: table.tableName,
        customerName: table.customerName,
        staffId: table.staffId,
        orders: table.orders.map((order) => ({
          id: order.id,
          status: order.status,
          discountCents: order.discountCents,
          items: order.items.map((line) => ({
            itemId: line.itemId,
            quantity: line.quantity,
            isComplimentary: line.isComplimentary,
            offerId: line.offerId,
            complimentaryReason: line.complimentaryReason,
            item: line.item,
          })),
        })),
      }
    : null;

  return (
    <div className="p-4 text-stone-950 sm:p-6">
      <header className="mx-auto mb-4 max-w-7xl">
        <p className="text-sm font-bold uppercase tracking-[0.25em] text-amber-700">
          POS Billing
        </p>
        <h1 className="mt-1 text-2xl font-black">Table order</h1>
        <p className="mt-1 text-sm text-stone-600">
          Save items to the table during service, reopen anytime, then settle or mark pending at the end.
        </p>
      </header>
      <PosBillingClient
        categories={categories}
        items={items}
        staff={staff}
        offers={offers}
        paymentMethods={paymentMethods}
        table={tableContext}
      />
    </div>
  );
}
