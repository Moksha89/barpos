import { PosBillingClient } from "@/components/pos-billing-client";
import { PageHeader } from "@/components/ui";
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
    <div className="app-page text-stone-950">
      <PageHeader
        eyebrow="POS Billing"
        title="Table order"
        subtitle="Save items to the table during service, reopen anytime, then settle or mark pending at the end."
      />
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
