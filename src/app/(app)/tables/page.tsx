import Link from "next/link";
import { differenceInMinutes } from "date-fns";
import { CreditCard, Edit3, Plus, ReceiptText, Table2 } from "lucide-react";

import { SubmitButton } from "@/components/form-controls";
import { ButtonLink, EmptyState, PageHeader, StatCard, StatusBadge } from "@/components/ui";
import { settlePendingOrder } from "@/lib/actions";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatCurrency } from "@/lib/money";
import { getActiveTableCards } from "@/lib/tables";

export const dynamic = "force-dynamic";

export default async function TablesPage({
  searchParams,
}: {
  searchParams: Promise<{ staffId?: string }>;
}) {
  await requirePermission("pos.create");
  const params = await searchParams;
  const [{ businessDay, tables }, staff, paymentMethods, pendingOrders] =
    await Promise.all([
      getActiveTableCards(),
      prisma.staff.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
      prisma.paymentMethod.findMany({
        where: { active: true },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      }),
      prisma.order.findMany({
        where: { status: "PENDING" },
        include: { staff: true, table: true },
        orderBy: { updatedAt: "desc" },
      }),
    ]);
  const openTables = tables.filter((table) => table.status === "OPEN");
  const visibleTables = params.staffId
    ? openTables.filter((table) => table.staffId === params.staffId)
    : openTables;
  const visiblePendingOrders = params.staffId
    ? pendingOrders.filter((order) => order.staffId === params.staffId)
    : pendingOrders;

  return (
    <div className="app-page text-stone-950">
      <div className="grid gap-4">
        <PageHeader
          eyebrow="Billing"
          title="Active tables and pending bills"
          subtitle={`Create tables, add or edit orders, settle bills, or keep unpaid bills pending by waitress. Business day ${businessDay.businessDate.toLocaleDateString("en-AE")} · ${businessDay.status}`}
          action={<ButtonLink href="/tables/new"><Plus className="h-4 w-4" />Create New Table</ButtonLink>}
        />

        <section className="grid gap-3 sm:grid-cols-3">
          <StatCard accent="dark" icon={Table2} label="Open tables" value={openTables.length} helper="Running bills" />
          <StatCard icon={ReceiptText} label="Visible" value={visibleTables.length} helper="After waitress filter" />
          <StatCard accent="red" label="Pending bills" value={visiblePendingOrders.length} helper="Unpaid collection" />
        </section>

        <nav className="flex gap-2 overflow-x-auto rounded-2xl border border-[var(--color-border)] bg-white p-2 shadow-sm">
          <Link
            className={`shrink-0 rounded-full px-3 py-2 text-xs font-black transition ${!params.staffId ? "bg-stone-950 text-white" : "bg-stone-100 text-stone-700 hover:bg-amber-50"}`}
            href="/tables"
          >
            All waitresses
          </Link>
          {staff.map((member) => (
            <Link
              className={`shrink-0 rounded-full px-3 py-2 text-xs font-black transition ${params.staffId === member.id ? "bg-stone-950 text-white" : "bg-stone-100 text-stone-700 hover:bg-amber-50"}`}
              href={`/tables?staffId=${member.id}`}
              key={member.id}
            >
              {member.name}
            </Link>
          ))}
        </nav>

        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {visibleTables.length === 0 ? (
            <EmptyState title="No active tables found" description="Create a new table or clear the waitress filter." />
          ) : null}
          {visibleTables.map((table) => {
            const bill = table.orders.reduce(
              (total, order) => total + order.netSalesCents + order.tipCents,
              0,
            );
            const latestOrder = table.orders[0];
            return (
              <article key={table.id} className="rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--color-gold-dark)]">
                      Table {table.tableNumber}
                    </p>
                    <h2 className="text-lg font-black">{table.tableName}</h2>
                  </div>
                  <b className="rounded-xl bg-amber-50 px-3 py-1.5 text-lg text-[var(--color-gold-dark)]">{formatCurrency(bill)}</b>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-stone-600">
                  <p><b>Customer</b><br />{table.customerName || "Walk-in"}</p>
                  <p><b>Waitress</b><br />{table.staff.name}</p>
                  <p><b>Order</b><br /><StatusBadge tone="warning">{latestOrder?.status ?? "Open"}</StatusBadge></p>
                  <p><b>Open</b><br />{Math.max(differenceInMinutes(new Date(), table.openedAt), 0)} min</p>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {table.status === "OPEN" ? (
                    <Link className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-stone-950 px-3 py-2 text-center text-sm font-black text-white transition hover:bg-stone-800" href={`/pos?tableId=${table.id}`}>
                      <Edit3 className="h-4 w-4" />
                      Add / edit order
                    </Link>
                  ) : null}
                  <Link className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[var(--color-border)] px-3 py-2 text-center text-sm font-black text-stone-950 transition hover:bg-stone-50" href={`/pos?tableId=${table.id}`}>
                    <CreditCard className="h-4 w-4" />
                    Settle / pending
                  </Link>
                  {latestOrder ? (
                    <Link className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-center text-sm font-black text-stone-950 transition hover:bg-stone-50 sm:col-span-2" href={`/invoices/customer/${latestOrder.id}`}>
                      Print Invoice
                    </Link>
                  ) : null}
                </div>
              </article>
            );
          })}
        </section>

        <section>
          <h2 className="text-lg font-black">Pending bills by waitress</h2>
          <p className="mt-1 text-sm text-stone-600">
            Use this when customers leave without paying and return later.
          </p>
          <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {visiblePendingOrders.length === 0 ? (
              <EmptyState title="No pending bills" description="No pending bills for this filter." />
            ) : (
              visiblePendingOrders.map((order) => {
                const due = order.netSalesCents + order.tipCents;
                return (
                  <article className="rounded-2xl border border-amber-200 bg-white p-4 shadow-sm" key={order.id}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--color-gold-dark)]">
                          {order.staff.name}
                        </p>
                        <h3 className="text-lg font-black">{order.tableNumber ?? order.table?.tableName ?? order.billNumber}</h3>
                      </div>
                      <b className="rounded-xl bg-amber-50 px-3 py-1.5 text-lg text-[var(--color-gold-dark)]">{formatCurrency(due)}</b>
                    </div>
                    <p className="mt-1 text-sm text-stone-600">
                      Customer: {order.customerName || "Walk-in"} · Bill {order.billNumber}
                    </p>
                    <form action={settlePendingOrder} className="mt-3 grid gap-2">
                      <input name="orderId" type="hidden" value={order.id} />
                      <input name="amount" type="hidden" value={due / 100} />
                      <select className="min-h-10 rounded-lg border border-[var(--color-border)] px-3 text-sm" name="paymentMethodId">
                        {paymentMethods.map((method) => (
                          <option key={method.id} value={method.id}>{method.name}</option>
                        ))}
                      </select>
                      <SubmitButton>Collect pending payment</SubmitButton>
                    </form>
                  </article>
                );
              })
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
