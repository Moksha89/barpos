import Link from "next/link";

import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatCurrency } from "@/lib/money";

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
    <div className="p-4 text-stone-950 sm:p-6">
      <section className="mx-auto grid max-w-7xl gap-5">
        <header>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-700">
            Invoices
          </p>
          <h1 className="mt-2 text-3xl font-black">Customer Invoices</h1>
          <p className="mt-2 text-stone-600">View and print settled customer bills.</p>
        </header>
        <div className="overflow-x-auto rounded-3xl bg-white shadow-sm">
          <table className="w-full min-w-[780px] text-left text-sm">
            <thead className="text-xs uppercase text-stone-500">
              <tr>
                <th className="px-4 py-3">Bill</th>
                <th className="px-4 py-3">Table</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Staff</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {orders.map((order) => (
                <tr key={order.id}>
                  <td className="px-4 py-3 font-black">{order.billNumber}</td>
                  <td className="px-4 py-3">{order.tableNumber ?? "-"}</td>
                  <td className="px-4 py-3">{order.customerName ?? "Walk-in"}</td>
                  <td className="px-4 py-3">{order.staff.name}</td>
                  <td className="px-4 py-3 font-bold">{formatCurrency(order.totalCollectedCents)}</td>
                  <td className="px-4 py-3">
                    <Link className="font-black text-amber-700" href={`/invoices/customer/${order.id}`}>
                      Print
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
