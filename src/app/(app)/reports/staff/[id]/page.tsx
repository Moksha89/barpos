import Link from "next/link";

import { AdminCard } from "@/components/admin-card";
import { DateRangeFilter } from "@/components/date-range-filter";
import { ButtonLink, StatCard, TableShell } from "@/components/ui";
import { requirePermission } from "@/lib/auth";
import { dateRangeFromSearchParams } from "@/lib/date-range";
import { prisma } from "@/lib/db";
import { formatCurrency } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function StaffReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ startDate?: string; endDate?: string }>;
}) {
  await requirePermission("reports.view");
  const { id } = await params;
  const range = dateRangeFromSearchParams(await searchParams);
  const [staff, orders, tips, advances, settlements, ledgerEntries] = await Promise.all([
    prisma.staff.findUniqueOrThrow({ where: { id } }),
    prisma.order.findMany({
      where: { staffId: id, status: "PAID", paidAt: { gte: range.start, lt: range.end } },
      include: { table: true, items: { include: { item: true } } },
      orderBy: { paidAt: "desc" },
    }),
    prisma.tip.findMany({
      where: { staffId: id, createdAt: { gte: range.start, lt: range.end } },
      include: { order: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.staffAdvance.findMany({
      where: { staffId: id, createdAt: { gte: range.start, lt: range.end } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.staffSettlement.findMany({
      where: { staffId: id, createdAt: { gte: range.start, lt: range.end } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.staffLedgerEntry.findMany({
      where: { staffId: id, createdAt: { gte: range.start, lt: range.end } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const salesCents = orders.reduce((total, order) => total + order.netSalesCents, 0);
  const normalSalesCents = orders.reduce((total, order) => total + order.normalCommissionSalesCents, 0);
  const specialSalesCents = orders.reduce((total, order) => total + order.specialCommissionSalesCents, 0);
  const normalCommissionCents = orders.reduce((total, order) => total + order.normalCommissionCents, 0);
  const specialCommissionCents = orders.reduce((total, order) => total + order.specialCommissionCents, 0);
  const ledgerCommissionCents = ledgerEntries
    .filter((entry) => entry.type === "COMMISSION_EARNED")
    .reduce((total, entry) => total + entry.creditCents, 0);
  const tipsCents = tips.reduce((total, tip) => total + tip.amountCents, 0);
  const advanceCents = advances.reduce((total, advance) => total + advance.amountCents, 0);
  const payoutCents = settlements.reduce((total, settlement) => total + settlement.amountPaidCents, 0);
  const latestBalanceCents = ledgerEntries[0]?.balanceCents ?? 0;

  return (
    <div className="app-page text-stone-950">
      <div className="grid gap-4">
        <header className="flex flex-col gap-3 rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-sm lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--color-gold-dark)]">Waitress detail</p>
            <h1 className="mt-1 text-xl font-black sm:text-2xl">{staff.name}</h1>
            <p className="mt-1 text-sm text-stone-600">Normal {staff.normalCommissionPercent}% · Special drinks 50% fixed · tables, amounts, commissions, tips, advances and payouts.</p>
          </div>
          <DateRangeFilter startDate={range.startDate} endDate={range.endDate} />
        </header>

        <div><ButtonLink href="/reports" variant="secondary">Back to reports</ButtonLink></div>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total sales" value={formatCurrency(salesCents)} />
          <StatCard accent="gold" label="Commission" value={formatCurrency(ledgerCommissionCents || normalCommissionCents + specialCommissionCents)} helper={`Normal ${formatCurrency(normalCommissionCents)} · Special ${formatCurrency(specialCommissionCents)}`} />
          <StatCard accent="green" label="Tips" value={formatCurrency(tipsCents)} />
          <StatCard accent="red" label="Advances" value={formatCurrency(advanceCents)} />
          <StatCard label="Special drink sales" value={formatCurrency(specialSalesCents)} />
          <StatCard label="Normal sales" value={formatCurrency(normalSalesCents)} />
          <StatCard accent="dark" label="Payouts" value={formatCurrency(payoutCents)} />
          <StatCard accent={latestBalanceCents >= 0 ? "green" : "red"} label="Ledger balance" value={formatCurrency(latestBalanceCents)} />
        </section>

        <AdminCard title="Tables and bills" eyebrow={`${orders.length} bills`}>
          <TableShell>
            <table className="premium-table min-w-[980px] text-left">
              <thead><tr><th>Date</th><th>Table</th><th>Customer</th><th className="currency-cell">Amount</th><th className="currency-cell">Normal commission</th><th className="currency-cell">Special drink commission</th><th className="currency-cell">Tips</th><th>Invoice</th></tr></thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td>{order.paidAt?.toLocaleDateString("en-AE") ?? "-"}</td>
                    <td className="font-bold">{order.table?.tableName ?? order.tableNumber ?? "Direct bill"}</td>
                    <td>{order.customerName || "Walk-in"}</td>
                    <td className="currency-cell font-black">{formatCurrency(order.netSalesCents)}</td>
                    <td className="currency-cell">{formatCurrency(order.normalCommissionCents)}</td>
                    <td className="currency-cell">{formatCurrency(order.specialCommissionCents)}</td>
                    <td className="currency-cell">{formatCurrency(order.tipCents)}</td>
                    <td><Link className="font-black text-[var(--color-gold-dark)]" href={`/invoices/customer/${order.id}`}>View</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableShell>
        </AdminCard>

        <div className="grid gap-3 lg:grid-cols-2">
          <AdminCard title="Advances taken" eyebrow={`${advances.length} rows`}>
            <ListRows rows={advances.map((advance) => [advance.createdAt.toLocaleDateString("en-AE"), `${formatCurrency(advance.amountCents)} · ${advance.paymentMode} · ${advance.reason ?? "Advance"}`])} />
          </AdminCard>
          <AdminCard title="Commission payouts" eyebrow={`${settlements.length} rows`}>
            <ListRows rows={settlements.map((settlement) => [settlement.receiptNumber, `${formatCurrency(settlement.amountPaidCents)} paid · ${formatCurrency(settlement.remainingPendingCents)} pending · ${settlement.status}`])} />
          </AdminCard>
        </div>

        <AdminCard title="Ledger history" eyebrow={`${ledgerEntries.length} rows`}>
          <ListRows rows={ledgerEntries.map((entry) => [entry.type.replaceAll("_", " "), `${entry.description} · +${formatCurrency(entry.creditCents)} / -${formatCurrency(entry.debitCents)} · Balance ${formatCurrency(entry.balanceCents)}`])} />
        </AdminCard>
      </div>
    </div>
  );
}

function ListRows({ rows }: { rows: string[][] }) {
  if (rows.length === 0) return <p className="text-sm text-stone-500">No rows in this date range.</p>;
  return <div className="grid max-h-[360px] gap-2 overflow-y-auto">{rows.map(([title, body], index) => <div className="rounded-xl border border-[var(--color-border)] bg-stone-50 p-2.5 text-sm" key={`${title}-${index}`}><b>{title}</b><span className="text-stone-600"> · {body}</span></div>)}</div>;
}
