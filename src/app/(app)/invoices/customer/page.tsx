import Link from "next/link";

import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatCurrency } from "@/lib/money";
import { PageHeader, TableShell } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function CustomerInvoicePage() {
  await requirePermission("pos.create");
  const orders = await prisma.order.findMany({
    where: { status: "PAID" },
    include: { staff: true },
    orderBy: { paidAt: "desc" },
    take: 50,
  });

  return (
    <div className="app-page text-stone-950">
      <section className="grid gap-4">
        <PageHeader eyebrow="Invoices" title="Customer Invoices" subtitle="View and print settled customer bills." />
        <TableShell>
          <table className="premium-table min-w-[780px] text-left">
            <thead>
              <tr>
                <th>Bill</th>
                <th>Table</th>
                <th>Customer</th>
                <th>Staff</th>
                <th className="currency-cell">Total</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td className="font-black">{order.billNumber}</td>
                  <td>{order.tableNumber ?? "-"}</td>
                  <td>{order.customerName ?? "Walk-in"}</td>
                  <td>{order.staff.name}</td>
                  <td className="currency-cell font-bold">{formatCurrency(order.totalCollectedCents)}</td>
                  <td>
                    <Link className="font-black text-[var(--color-gold-dark)]" href={`/invoices/customer/${order.id}`}>
                      Print
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableShell>
      </section>
    </div>
  );
}
