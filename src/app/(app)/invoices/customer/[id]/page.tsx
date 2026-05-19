import { notFound } from "next/navigation";

import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatCurrency } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function CustomerInvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission("pos.create");
  const { id } = await params;
  const [order, invoiceSetting] = await Promise.all([
    prisma.order.findUnique({
      where: { id },
      include: {
        staff: true,
        items: { include: { item: true } },
        payments: true,
      },
    }),
    prisma.invoiceSetting.findFirst(),
  ]);

  if (!order) {
    notFound();
  }

  return (
    <div className="bg-white p-4 text-stone-950">
      <section className="mx-auto max-w-md border border-stone-200 p-5 print:border-0">
        <div className="text-center">
          <h1 className="text-2xl font-black">
            {invoiceSetting?.restaurantName ?? "BarPOS"}
          </h1>
          <p className="text-sm text-stone-600">{invoiceSetting?.address}</p>
          <p className="text-sm text-stone-600">{invoiceSetting?.phone}</p>
          {invoiceSetting?.gstNumber ? (
            <p className="text-xs text-stone-500">GST: {invoiceSetting.gstNumber}</p>
          ) : null}
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2 text-sm">
          <p><b>Bill:</b> {order.billNumber}</p>
          <p><b>Date:</b> {order.createdAt.toLocaleString("en-AE")}</p>
          <p><b>Table:</b> {order.tableNumber ?? "-"}</p>
          <p><b>Staff:</b> {order.staff.name}</p>
        </div>

        <table className="mt-5 w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="py-2">Item</th>
              <th className="py-2 text-right">Qty</th>
              <th className="py-2 text-right">Amt</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((line) => (
              <tr className="border-b border-stone-100" key={line.id}>
                <td className="py-2">
                  {line.item.name}
                  {line.isComplimentary ? (
                    <span className="ml-1 text-xs font-bold text-amber-700">
                      Complimentary
                    </span>
                  ) : null}
                </td>
                <td className="py-2 text-right">{line.quantity}</td>
                <td className="py-2 text-right">{formatCurrency(line.amountCents)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4 grid gap-1 text-sm">
          <div className="flex justify-between"><span>Subtotal</span><b>{formatCurrency(order.subtotalCents)}</b></div>
          <div className="flex justify-between"><span>Discount</span><b>{formatCurrency(order.discountCents)}</b></div>
          <div className="flex justify-between"><span>Tax</span><b>{formatCurrency(order.taxCents)}</b></div>
          <div className="flex justify-between"><span>Net Bill</span><b>{formatCurrency(order.netSalesCents)}</b></div>
          <div className="flex justify-between"><span>Tip</span><b>{formatCurrency(order.tipCents)}</b></div>
          <div className="flex justify-between border-t pt-2 text-base"><span>Total Paid</span><b>{formatCurrency(order.totalCollectedCents)}</b></div>
        </div>

        <p className="mt-4 text-sm">
          Payment: {order.payments.map((payment) => `${payment.mode} ${formatCurrency(payment.amountCents)}`).join(" / ")}
        </p>
        <p className="mt-5 text-center text-sm font-bold">
          {invoiceSetting?.thankYouMessage ?? "Thank you. Visit again!"}
        </p>
        <button className="no-print mt-5 min-h-11 w-full rounded-xl bg-stone-950 font-bold text-white" onClick={undefined}>
          Use browser print
        </button>
      </section>
    </div>
  );
}
