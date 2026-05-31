import Link from "next/link";
import { PosBillingClient } from "@/components/pos-billing-client";
import { ButtonLink, PageHeader, StatusBadge } from "@/components/ui";
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
      where: { active: true, sellingPriceCents: { gt: 0 } },
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
  const unavailableTable =
    table && table.status !== "OPEN"
      ? {
          id: table.id,
          tableName: table.tableName,
          status: table.status,
          customerName: table.customerName,
        }
      : null;

  return (
    <div className="app-page text-stone-950">
      <PageHeader
        eyebrow="POS Billing"
        title="Table order"
        subtitle="Save items to the table during service, reopen anytime, then settle or mark pending at the end."
      />
      {unavailableTable ? (
        <section className="rounded-2xl border border-amber-200 bg-white p-5 shadow-sm">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--color-gold-dark)]">
            Table unavailable
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-black text-stone-950">{unavailableTable.tableName}</h2>
            <StatusBadge tone="warning">{unavailableTable.status}</StatusBadge>
          </div>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">
            This table is already {unavailableTable.status.toLowerCase()} and cannot be edited from POS.
            Use Billing to create a new table, or use Active Tables to collect a pending bill.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <ButtonLink href="/" variant="primary">Go to Billing</ButtonLink>
            <ButtonLink href="/tables" variant="secondary">View Active Tables</ButtonLink>
            <Link
              className="inline-flex min-h-9 items-center justify-center rounded-lg px-3 text-sm font-black text-stone-600 transition hover:bg-stone-50"
              href="/tables/new"
            >
              Create table page
            </Link>
          </div>
        </section>
      ) : (
        <PosBillingClient
          categories={categories}
          items={items}
          staff={staff}
          offers={offers}
          paymentMethods={paymentMethods}
          table={tableContext}
        />
      )}
    </div>
  );
}
