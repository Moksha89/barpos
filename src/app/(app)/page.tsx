import Link from "next/link";
import { differenceInMinutes } from "date-fns";
import { BadgeDollarSign, CalendarClock, CheckCircle2, Plus, Table2 } from "lucide-react";

import { closeBusinessDay, openBusinessDay } from "@/lib/actions";
import { requirePermission } from "@/lib/auth";
import { formatCurrency } from "@/lib/money";
import { getActiveTableCards } from "@/lib/tables";
import { Button, ButtonLink, EmptyState, PageHeader, StatCard, StatusBadge, TableShell } from "@/components/ui";

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
    <div className="app-page text-stone-950">
      <PageHeader
        eyebrow="Active Tables"
        title="Table billing dashboard"
        subtitle="Save running orders, reopen active tables, settle at the end, or keep unpaid bills pending by waitress."
        action={
          <>
            <form action={openBusinessDay}>
              <Button size="md" type="submit" variant="secondary">
                Open Day
              </Button>
            </form>
            <form action={closeBusinessDay}>
              <Button size="md" type="submit" variant="dark">
                Close Day
              </Button>
            </form>
            <ButtonLink href="/tables/new" size="md">
              <Plus className="h-4 w-4" />
              Add New Table
            </ButtonLink>
          </>
        }
      />

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={CalendarClock} label="Day Status" value={businessDay.status} helper={businessDay.businessDate.toLocaleDateString("en-AE")} />
        <StatCard icon={Table2} label="Open Tables" value={openTables.length} helper="Currently billing" accent="dark" />
        <StatCard icon={CheckCircle2} label="Settled Bills" value={settledTables.length} helper="Paid/closed today" accent="green" />
        <StatCard icon={BadgeDollarSign} label="Today Sales" value={formatCurrency(todaySalesCents)} helper={`Active ${formatCurrency(activeBillCents)}`} />
      </section>

      <section className="grid gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-black">Open tables</h2>
            <p className="text-sm text-stone-600">Cards stay active until the table bill is settled.</p>
          </div>
          <Link className="rounded-lg bg-stone-950 px-3 py-2 text-center text-sm font-black text-white transition hover:bg-stone-800" href="/tables">
            View all tables
          </Link>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {openTables.length === 0 ? (
            <EmptyState
              title="No active tables"
              description="Create the first bill for today's service."
              action={<ButtonLink href="/tables/new" size="lg">
                Add New Table
              </ButtonLink>}
            />
          ) : (
            openTables.map((table) => {
              const minutes = differenceInMinutes(new Date(), table.openedAt);
              const billAmount = table.orders.reduce(
                (total, order) => total + order.netSalesCents,
                0,
              );
              return (
                <article key={table.id} className="rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--color-gold-dark)]">
                        Table {table.tableNumber}
                      </p>
                      <h3 className="mt-1 text-lg font-black">{table.tableName}</h3>
                      <div className="mt-2"><StatusBadge tone="warning">Open</StatusBadge></div>
                    </div>
                    <b className="rounded-xl bg-amber-50 px-3 py-1.5 text-lg text-[var(--color-gold-dark)]">{formatCurrency(billAmount)}</b>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-stone-600">
                    <p><b>Customer</b><br />{table.customerName || "Walk-in"}</p>
                    <p><b>Waitress</b><br />{table.staff.name}</p>
                    <p><b>Guests</b><br />{table.guestCount ?? "-"}</p>
                    <p><b>Open</b><br />{minutes < 1 ? "Just opened" : `${minutes} min`}</p>
                  </div>
                  <Link
                    className="mt-4 inline-flex min-h-10 w-full items-center justify-center rounded-lg bg-stone-950 font-black text-white transition hover:bg-stone-800"
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
          <h2 className="text-lg font-black">Completed / paid bills</h2>
          <div className="mt-3">
          <TableShell>
            <table className="premium-table min-w-[760px] text-left">
              <thead>
                <tr>
                  <th>Table</th>
                  <th>Customer</th>
                  <th>Staff</th>
                  <th>Status</th>
                  <th className="currency-cell">Bill</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {settledTables.map((table) => {
                  const order = table.orders[0];
                  return (
                    <tr key={table.id}>
                      <td className="font-bold">{table.tableName}</td>
                      <td>{table.customerName || "Walk-in"}</td>
                      <td>{table.staff.name}</td>
                      <td><StatusBadge tone="success">{table.status}</StatusBadge></td>
                      <td className="currency-cell font-black">{formatCurrency(order?.netSalesCents ?? 0)}</td>
                      <td>
                        {order ? (
                          <Link className="font-black text-[var(--color-gold-dark)]" href={`/invoices/customer/${order.id}`}>
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
          </TableShell>
          </div>
        </div>
      </section>
    </div>
  );
}
