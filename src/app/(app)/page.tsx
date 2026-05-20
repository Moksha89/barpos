import Link from "next/link";
import { differenceInMinutes } from "date-fns";
import {
  BadgeDollarSign,
  CalendarClock,
  ClipboardList,
  Clock,
  Filter,
  MoreVertical,
  Moon,
  Plus,
  ReceiptText,
  Sparkles,
  Sun,
  Table2,
} from "lucide-react";

import { closeBusinessDay, openBusinessDay } from "@/lib/actions";
import { requirePermission } from "@/lib/auth";
import { formatCurrency } from "@/lib/money";
import { getActiveTableCards } from "@/lib/tables";
import { Button, ButtonLink, StatusBadge } from "@/components/ui";

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
  const dateLabel = businessDay.businessDate.toLocaleDateString("en-AE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    weekday: "short",
  });

  return (
    <div className="app-page text-stone-950">
      <section className="relative overflow-hidden rounded-[26px] bg-[#050505] p-5 text-white shadow-[0_18px_50px_rgba(15,23,42,0.12)] sm:p-6 lg:p-8">
        <div className="absolute right-10 top-0 hidden h-52 w-52 rounded-full border border-dashed border-[var(--color-gold)]/25 lg:block" />
        <div className="absolute right-20 top-8 hidden h-36 w-36 rounded-full border border-dashed border-[var(--color-gold)]/20 lg:block" />
        <div className="relative grid gap-5 lg:grid-cols-[minmax(0,1fr)_328px] lg:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--color-gold)]">
              Active tables
            </p>
            <h1 className="mt-3 max-w-xl text-2xl font-black tracking-tight sm:text-[28px]">
              Table billing dashboard
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-stone-200">
              Save orders during dinner, reopen active tables, settle at the end, or keep unpaid bills pending by waitress.
            </p>
          </div>
          <div className="grid gap-3">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-2">
              <form action={openBusinessDay}>
                <Button className="min-h-12 w-full border-white/30 bg-white/5 text-white hover:bg-white/10" size="lg" type="submit" variant="secondary">
                  <Sun className="h-4 w-4 text-[var(--color-gold)]" />
                  Open Day
                </Button>
              </form>
              <form action={closeBusinessDay}>
                <Button className="min-h-12 w-full border-white/30 bg-white/5 text-white hover:bg-white/10" size="lg" type="submit" variant="secondary">
                  <Moon className="h-4 w-4 text-white" />
                  Close Day
                </Button>
              </form>
            </div>
            <ButtonLink className="min-h-12 w-full text-sm" href="/tables/new" size="lg">
              <Plus className="h-4 w-4" />
              Add New Table
            </ButtonLink>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardKpiCard
          icon={CalendarClock}
          label="Day Status"
          value={businessDay.status}
          helper={dateLabel}
          statusText={businessDay.status === "OPEN" ? "Day is active" : "Day is closed"}
        />
        <DashboardKpiCard icon={Table2} label="Open Tables" value={openTables.length} helper="Currently billing" />
        <DashboardKpiCard icon={ReceiptText} label="Settled Bills" value={settledTables.length} helper="Paid/closed today" />
        <DashboardKpiCard icon={BadgeDollarSign} label="Today Sales" value={formatCurrency(todaySalesCents)} helper={`Active ${formatCurrency(activeBillCents)}`} />
      </section>

      <section className="rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-black">Open tables</h2>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-stone-600">
              <Clock className="h-4 w-4" />
              Cards stay active until the table bill is settled.
            </p>
          </div>
          <Link className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[var(--color-border)] px-4 text-sm font-black text-stone-950 transition hover:bg-stone-50" href="/tables">
            <ClipboardList className="h-4 w-4" />
            View all tables
          </Link>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {openTables.length === 0 ? (
            <div className="col-span-full rounded-2xl border border-dashed border-stone-300 bg-white px-4 py-7 text-center">
              <div className="mx-auto grid max-w-3xl gap-4 sm:grid-cols-[220px_1fr] sm:items-center sm:text-left">
                <div className="mx-auto grid h-32 w-52 place-items-center">
                  <div className="relative h-24 w-40">
                    <span className="absolute bottom-3 left-9 h-1 w-24 rounded-full bg-stone-300" />
                    <span className="absolute bottom-4 left-16 h-14 w-14 rounded-full bg-amber-50" />
                    <span className="absolute bottom-5 left-20 h-8 w-8 rounded-full border border-stone-900 bg-white" />
                    <span className="absolute bottom-5 left-4 h-16 w-1.5 -rotate-6 rounded-full bg-stone-900" />
                    <span className="absolute bottom-5 left-0 h-1.5 w-10 rounded-full bg-stone-900" />
                    <span className="absolute bottom-5 right-4 h-16 w-1.5 rotate-6 rounded-full bg-stone-900" />
                    <span className="absolute bottom-5 right-0 h-1.5 w-10 rounded-full bg-stone-900" />
                    <Sparkles className="absolute left-[82px] top-5 h-5 w-5 text-green-600" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-black">No active tables</h3>
                  <p className="mt-1 text-sm text-stone-600">Create the first bill for today&apos;s service.</p>
                  <ButtonLink className="mt-4" href="/tables/new" size="md">
                    <Plus className="h-4 w-4" />
                    Add New Table
                  </ButtonLink>
                </div>
              </div>
            </div>
          ) : (
            openTables.map((table) => {
              const minutes = differenceInMinutes(new Date(), table.openedAt);
              const billAmount = table.orders.reduce(
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
                      <h3 className="mt-1 text-lg font-black">{table.tableName}</h3>
                      <div className="mt-2"><StatusBadge tone="warning">{latestOrder?.status ?? "OPEN"}</StatusBadge></div>
                    </div>
                    <b className="rounded-xl bg-amber-50 px-3 py-1.5 text-lg text-[var(--color-gold-dark)]">{formatCurrency(billAmount)}</b>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-stone-600">
                    <p><b>Customer</b><br />{table.customerName || "Walk-in"}</p>
                    <p><b>Waitress</b><br />{table.staff.name}</p>
                    <p><b>Guests</b><br />{table.guestCount ?? "-"}</p>
                    <p><b>Open</b><br />{minutes < 1 ? "Just opened" : `${minutes} min`}</p>
                  </div>
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    <Link
                      className="inline-flex min-h-10 items-center justify-center rounded-lg bg-stone-950 px-3 text-sm font-black text-white transition hover:bg-stone-800"
                      href={`/pos?tableId=${table.id}`}
                    >
                      Continue Billing
                    </Link>
                    {latestOrder ? (
                      <Link
                        className="inline-flex min-h-10 items-center justify-center rounded-lg border border-[var(--color-border)] px-3 text-sm font-black text-stone-950 transition hover:bg-stone-50"
                        href={`/invoices/customer/${latestOrder.id}`}
                      >
                        Print Invoice
                      </Link>
                    ) : null}
                  </div>
                </article>
              );
            })
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-black">Completed / Paid Bills</h2>
          <div className="flex gap-2">
            <button className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[var(--color-border)] bg-white px-4 text-sm font-semibold text-stone-800" type="button">
              <CalendarClock className="h-4 w-4" />
              Today
            </button>
            <button className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[var(--color-border)] bg-white px-4 text-sm font-semibold text-stone-800" type="button">
              <Filter className="h-4 w-4" />
              Filters
            </button>
          </div>
        </div>

        <div className="mt-4 hidden overflow-hidden rounded-xl border border-[var(--color-border)] md:block">
          <table className="premium-table text-left">
            <thead>
              <tr>
                <th>Table</th>
                <th>Customer</th>
                <th>Staff</th>
                <th>Status</th>
                <th className="currency-cell">Bill</th>
                <th>Paid At</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {settledTables.length === 0 ? (
                <tr>
                  <td className="py-6 text-center text-sm text-stone-500" colSpan={7}>No completed bills for today.</td>
                </tr>
              ) : settledTables.map((table) => {
                const order = table.orders[0];
                return (
                  <tr key={table.id}>
                    <td className="font-bold">{table.tableName}</td>
                    <td>{table.customerName || "Walk-in Customer"}</td>
                    <td>{table.staff.name}</td>
                    <td><PaidBadge /></td>
                    <td className="currency-cell font-black">{formatCurrency(order?.netSalesCents ?? 0)}</td>
                    <td>{(order?.paidAt ?? table.settledAt ?? table.closedAt)?.toLocaleString("en-AE", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) ?? "-"}</td>
                    <td className="text-right">
                      {order ? (
                        <Link className="inline-grid h-8 w-8 place-items-center rounded-lg text-stone-700 transition hover:bg-stone-100" href={`/invoices/customer/${order.id}`} title="Print invoice">
                          <MoreVertical className="h-4 w-4" />
                        </Link>
                      ) : "-"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-4 grid gap-2 md:hidden">
          {settledTables.length === 0 ? (
            <div className="rounded-xl border border-[var(--color-border)] p-4 text-center text-sm text-stone-500">No completed bills for today.</div>
          ) : settledTables.map((table) => {
            const order = table.orders[0];
            return (
              <Link className="rounded-xl border border-[var(--color-border)] bg-white p-3 shadow-sm" href={order ? `/invoices/customer/${order.id}` : "#"} key={table.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-black">{table.tableName}</p>
                    <p className="mt-0.5 text-xs text-stone-500">{table.customerName || "Walk-in Customer"}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black">{formatCurrency(order?.netSalesCents ?? 0)}</p>
                    <p className="mt-0.5 text-xs text-stone-500">{(order?.paidAt ?? table.settledAt ?? table.closedAt)?.toLocaleTimeString("en-AE", { hour: "2-digit", minute: "2-digit" }) ?? "-"}</p>
                  </div>
                </div>
                <div className="mt-2"><PaidBadge /></div>
              </Link>
            );
          })}
          <Link className="mt-2 inline-flex min-h-10 items-center justify-center rounded-lg bg-[var(--color-gold)] text-sm font-black text-stone-950" href="/invoices/customer">
            View all bills
          </Link>
        </div>
      </section>
    </div>
  );
}

function DashboardKpiCard({
  helper,
  icon: Icon,
  label,
  statusText,
  value,
}: {
  helper: string;
  icon: typeof CalendarClock;
  label: string;
  statusText?: string;
  value: React.ReactNode;
}) {
  return (
    <article className="rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-start gap-4">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-amber-50 text-[var(--color-gold)]">
          <Icon className="h-6 w-6" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-stone-700">{label}</p>
          <p className="mt-1 truncate text-xl font-black text-stone-950">{value}</p>
          <p className="mt-3 text-xs text-stone-500">{helper}</p>
          {statusText ? (
            <p className="mt-1 inline-flex items-center gap-1.5 text-xs font-bold text-green-600">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              {statusText}
            </p>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function PaidBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-black text-green-700">
      <span className="h-1.5 w-1.5 rounded-full bg-green-600" />
      Paid
    </span>
  );
}
