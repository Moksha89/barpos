import Link from "next/link";
import { differenceInMinutes } from "date-fns";

import { SubmitButton } from "@/components/form-controls";
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
    <div className="p-2.5 text-stone-950 sm:p-4">
      <div className="mx-auto grid max-w-7xl gap-3">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-700">
              Tables
            </p>
            <h1 className="mt-1 text-lg font-black">Active tables</h1>
            <p className="mt-1 text-sm text-stone-600">
              Business day {businessDay.businessDate.toLocaleDateString("en-AE")} · {businessDay.status}
            </p>
          </div>
          <Link className="rounded-xl bg-amber-400 px-3 py-2 text-center font-black text-stone-950" href="/tables/new">
            Add New Table
          </Link>
        </header>

        <nav className="flex gap-2 overflow-x-auto pb-1">
          <Link
            className={`rounded-full px-3 py-2 text-sm font-black ${!params.staffId ? "bg-stone-950 text-white" : "bg-white text-stone-700"}`}
            href="/tables"
          >
            All waitresses
          </Link>
          {staff.map((member) => (
            <Link
              className={`rounded-full px-3 py-2 text-sm font-black ${params.staffId === member.id ? "bg-stone-950 text-white" : "bg-white text-stone-700"}`}
              href={`/tables?staffId=${member.id}`}
              key={member.id}
            >
              {member.name}
            </Link>
          ))}
        </nav>

        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {visibleTables.map((table) => {
            const bill = table.orders.reduce(
              (total, order) => total + order.netSalesCents + order.tipCents,
              0,
            );
            const latestOrder = table.orders[0];
            return (
              <article key={table.id} className="rounded-xl bg-white p-3 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">
                      Table {table.tableNumber}
                    </p>
                    <h2 className="text-lg font-black">{table.tableName}</h2>
                  </div>
                  <b className="text-lg text-amber-700">{formatCurrency(bill)}</b>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-stone-600">
                  <p><b>Customer</b><br />{table.customerName || "Walk-in"}</p>
                  <p><b>Waitress</b><br />{table.staff.name}</p>
                  <p><b>Order</b><br />{latestOrder?.status ?? "Open"}</p>
                  <p><b>Open</b><br />{Math.max(differenceInMinutes(new Date(), table.openedAt), 0)} min</p>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {table.status === "OPEN" ? (
                    <Link className="rounded-xl bg-stone-950 px-3 py-2 text-center text-sm font-black text-white" href={`/pos?tableId=${table.id}`}>
                      Continue Billing
                    </Link>
                  ) : null}
                  {latestOrder ? (
                    <Link className="rounded-xl border border-stone-200 px-3 py-2 text-center text-sm font-black text-stone-950" href={`/invoices/customer/${latestOrder.id}`}>
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
              <article className="rounded-xl border border-dashed border-stone-300 bg-white p-4 text-sm text-stone-600">
                No pending bills for this filter.
              </article>
            ) : (
              visiblePendingOrders.map((order) => {
                const due = order.netSalesCents + order.tipCents;
                return (
                  <article className="rounded-xl border border-amber-200 bg-white p-3 shadow-sm" key={order.id}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-700">
                          {order.staff.name}
                        </p>
                        <h3 className="text-lg font-black">{order.tableNumber ?? order.table?.tableName ?? order.billNumber}</h3>
                      </div>
                      <b className="text-lg text-amber-700">{formatCurrency(due)}</b>
                    </div>
                    <p className="mt-1 text-sm text-stone-600">
                      Customer: {order.customerName || "Walk-in"} · Bill {order.billNumber}
                    </p>
                    <form action={settlePendingOrder} className="mt-3 grid gap-2">
                      <input name="orderId" type="hidden" value={order.id} />
                      <input name="amount" type="hidden" value={due / 100} />
                      <select className="min-h-10 rounded-xl border border-stone-200 px-3 text-sm" name="paymentMethodId">
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
