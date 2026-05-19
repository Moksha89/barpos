import Link from "next/link";
import { differenceInMinutes } from "date-fns";

import { requirePermission } from "@/lib/auth";
import { formatCurrency } from "@/lib/money";
import { getActiveTableCards } from "@/lib/tables";

export const dynamic = "force-dynamic";

export default async function TablesPage() {
  await requirePermission("pos.create");
  const { businessDay, tables } = await getActiveTableCards();

  return (
    <div className="p-4 text-stone-950 sm:p-6">
      <div className="mx-auto grid max-w-7xl gap-5">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-amber-700">
              Tables
            </p>
            <h1 className="mt-2 text-3xl font-black">Active Tables</h1>
            <p className="mt-2 text-stone-600">
              Business day {businessDay.businessDate.toLocaleDateString("en-AE")} · {businessDay.status}
            </p>
          </div>
          <Link className="rounded-2xl bg-amber-400 px-5 py-3 text-center font-black text-stone-950" href="/tables/new">
            Add New Table
          </Link>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {tables.map((table) => {
            const bill = table.orders.reduce(
              (total, order) => total + order.netSalesCents + order.tipCents,
              0,
            );
            const latestOrder = table.orders[0];
            return (
              <article key={table.id} className="rounded-3xl bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">
                      Table {table.tableNumber}
                    </p>
                    <h2 className="text-2xl font-black">{table.tableName}</h2>
                  </div>
                  <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-black">
                    {table.status}
                  </span>
                </div>
                <div className="mt-4 grid gap-2 text-sm text-stone-600">
                  <p><b>Customer:</b> {table.customerName || "Walk-in"}</p>
                  <p><b>Staff:</b> {table.staff.name}</p>
                  <p><b>Current bill:</b> {formatCurrency(bill)}</p>
                  <p><b>Order status:</b> {latestOrder?.status ?? "Open"}</p>
                  <p><b>Time:</b> {Math.max(differenceInMinutes(new Date(), table.openedAt), 0)} min</p>
                  <p><b>Payment:</b> {table.status === "SETTLED" ? "Paid" : "Pending"}</p>
                </div>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {table.status === "OPEN" ? (
                    <Link className="rounded-2xl bg-stone-950 px-4 py-3 text-center text-sm font-black text-white" href={`/pos?tableId=${table.id}`}>
                      Continue Billing
                    </Link>
                  ) : null}
                  {latestOrder ? (
                    <Link className="rounded-2xl border border-stone-200 px-4 py-3 text-center text-sm font-black text-stone-950" href={`/invoices/customer/${latestOrder.id}`}>
                      Print Invoice
                    </Link>
                  ) : null}
                </div>
              </article>
            );
          })}
        </section>
      </div>
    </div>
  );
}
