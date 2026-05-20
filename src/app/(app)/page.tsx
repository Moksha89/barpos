import Link from "next/link";
import { differenceInMinutes } from "date-fns";

import { closeBusinessDay, openBusinessDay } from "@/lib/actions";
import { requirePermission } from "@/lib/auth";
import { formatCurrency } from "@/lib/money";
import { getActiveTableCards } from "@/lib/tables";

export const dynamic = "force-dynamic";

export default async function Home() {
  await requirePermission("dashboard.view");
  const { businessDay, tables } = await getActiveTableCards();
  const openTables = tables.filter((table) => table.status === "OPEN");
  const settledTables = tables.filter((table) => table.status === "SETTLED");
  const todaySalesCents = tables.reduce(
    (total, table) =>
      total +
      table.orders.reduce(
        (orderTotal, order) =>
          order.status === "PAID" ? orderTotal + order.netSalesCents : orderTotal,
        0,
      ),
    0,
  );
  const activeBillCents = openTables.reduce(
    (total, table) =>
      total +
      table.orders.reduce(
        (orderTotal, order) =>
          order.status === "DRAFT" ? orderTotal + order.netSalesCents : orderTotal,
        0,
      ),
    0,
  );

  return (
    <div className="p-4 text-stone-950 sm:p-6">
      <section className="rounded-2xl bg-stone-950 px-4 py-4 text-white sm:px-5">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-amber-300">
              Active Tables
            </p>
            <h1 className="mt-1 max-w-3xl text-2xl font-black tracking-tight sm:text-3xl">
              Table billing dashboard
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-stone-300">
              Save orders during dinner, reopen active tables, settle at the end, or keep unpaid bills pending by waitress.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <form action={openBusinessDay}>
              <button className="min-h-10 rounded-xl bg-white px-4 font-black text-stone-950" type="submit">
                Open Day
              </button>
            </form>
            <form action={closeBusinessDay}>
              <button className="min-h-10 rounded-xl border border-white/20 px-4 font-black text-white" type="submit">
                Close Day
              </button>
            </form>
            <Link
              href="/tables/new"
              className="inline-flex min-h-10 items-center justify-center rounded-xl bg-amber-400 px-4 py-2 text-sm font-bold text-stone-950"
            >
              Add New Table
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-3 px-2 py-4 sm:grid-cols-2 sm:px-4 lg:grid-cols-4 lg:px-6">
        {[
          ["Day Status", businessDay.status, businessDay.businessDate.toLocaleDateString("en-AE")],
          ["Open Tables", String(openTables.length), "Currently billing"],
          ["Settled Bills", String(settledTables.length), "Paid/closed today"],
          ["Today Sales", formatCurrency(todaySalesCents), `Active ${formatCurrency(activeBillCents)}`],
        ].map(([label, value, note]) => (
          <article
            key={label}
            className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm"
          >
            <p className="text-sm font-medium text-stone-500">{label}</p>
            <p className="mt-1 text-2xl font-black text-stone-950">
              {value}
            </p>
            <p className="mt-2 text-sm text-stone-500">{note}</p>
          </article>
        ))}
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-2 pb-8 sm:px-4 lg:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-black">Open tables</h2>
            <p className="text-sm text-stone-600">Cards stay active until the table bill is settled.</p>
          </div>
          <Link className="rounded-2xl bg-stone-950 px-4 py-3 text-center text-sm font-black text-white" href="/tables">
            View all tables
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {openTables.length === 0 ? (
            <article className="rounded-3xl border border-dashed border-stone-300 bg-white p-6 text-center">
              <h3 className="text-xl font-black">No active tables</h3>
              <p className="mt-2 text-sm text-stone-600">Create the first bill for today&apos;s service.</p>
              <Link className="mt-4 inline-flex min-h-11 items-center rounded-2xl bg-amber-400 px-5 font-black text-stone-950" href="/tables/new">
                Add New Table
              </Link>
            </article>
          ) : (
            openTables.map((table) => {
              const minutes = differenceInMinutes(new Date(), table.openedAt);
              const billAmount = table.orders.reduce(
                (total, order) => total + order.netSalesCents,
                0,
              );
              return (
                <article key={table.id} className="rounded-2xl bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">
                        Table {table.tableNumber}
                      </p>
                      <h3 className="mt-1 text-xl font-black">{table.tableName}</h3>
                    </div>
                    <b className="text-lg text-amber-700">{formatCurrency(billAmount)}</b>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-stone-600">
                    <p><b>Customer</b><br />{table.customerName || "Walk-in"}</p>
                    <p><b>Waitress</b><br />{table.staff.name}</p>
                    <p><b>Guests</b><br />{table.guestCount ?? "-"}</p>
                    <p><b>Open</b><br />{minutes < 1 ? "Just opened" : `${minutes} min`}</p>
                  </div>
                  <Link
                    className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-stone-950 font-black text-white"
                    href={`/pos?tableId=${table.id}`}
                  >
                    Continue Billing
                  </Link>
                </article>
              );
            })
          )}
        </div>

        <div>
          <h2 className="text-2xl font-black">Completed / paid bills</h2>
          <div className="mt-3 overflow-x-auto rounded-3xl bg-white shadow-sm">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="text-xs uppercase text-stone-500">
                <tr>
                  <th className="px-4 py-3">Table</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Staff</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Bill</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {settledTables.map((table) => {
                  const order = table.orders[0];
                  return (
                    <tr key={table.id}>
                      <td className="px-4 py-3 font-bold">{table.tableName}</td>
                      <td className="px-4 py-3">{table.customerName || "Walk-in"}</td>
                      <td className="px-4 py-3">{table.staff.name}</td>
                      <td className="px-4 py-3">{table.status}</td>
                      <td className="px-4 py-3">{formatCurrency(order?.netSalesCents ?? 0)}</td>
                      <td className="px-4 py-3">
                        {order ? (
                          <Link className="font-black text-amber-700" href={`/invoices/customer/${order.id}`}>
                            Print invoice
                          </Link>
                        ) : (
                          "-"
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
