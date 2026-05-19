import { notFound } from "next/navigation";

import { prisma } from "@/lib/db";
import { formatCurrency } from "@/lib/money";

export default async function SettlementReceiptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [settlement, invoiceSetting] = await Promise.all([
    prisma.staffSettlement.findUnique({
      where: { id },
      include: { staff: true },
    }),
    prisma.invoiceSetting.findFirst(),
  ]);

  if (!settlement) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-white p-4 text-stone-950">
      <section className="mx-auto max-w-lg border border-stone-200 p-6 print:border-0">
        <div className="text-center">
          <h1 className="text-2xl font-black">
            {invoiceSetting?.restaurantName ?? "BarPOS"}
          </h1>
          <p className="text-sm text-stone-600">Waitress Settlement Receipt</p>
          <p className="text-sm font-bold">{settlement.receiptNumber}</p>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2 text-sm">
          <p><b>Waitress:</b> {settlement.staff.name}</p>
          <p><b>Date:</b> {settlement.createdAt.toLocaleDateString("en-IN")}</p>
          <p><b>From:</b> {settlement.startDate.toLocaleDateString("en-IN")}</p>
          <p><b>To:</b> {settlement.endDate.toLocaleDateString("en-IN")}</p>
        </div>

        <div className="mt-5 grid gap-2 text-sm">
          <div className="flex justify-between"><span>Normal Sales</span><b>{formatCurrency(settlement.normalSalesCents)}</b></div>
          <div className="flex justify-between"><span>Normal Commission @ {settlement.normalCommissionPercent}%</span><b>{formatCurrency(settlement.normalCommissionCents)}</b></div>
          <div className="flex justify-between"><span>Special Drink Sales</span><b>{formatCurrency(settlement.specialDrinkSalesCents)}</b></div>
          <div className="flex justify-between"><span>Special Commission @ {settlement.specialCommissionPercent}%</span><b>{formatCurrency(settlement.specialCommissionCents)}</b></div>
          <div className="flex justify-between border-t pt-2"><span>Total Commission</span><b>{formatCurrency(settlement.totalCommissionCents)}</b></div>
          <div className="flex justify-between"><span>Tips</span><b>{formatCurrency(settlement.tipsCents)}</b></div>
          <div className="flex justify-between"><span>Previous Pending</span><b>{formatCurrency(settlement.previousPendingCents)}</b></div>
          <div className="flex justify-between"><span>Advance Balance</span><b>{formatCurrency(settlement.advanceBalanceCents)}</b></div>
          <div className="flex justify-between"><span>Advance Deducted</span><b>{formatCurrency(settlement.advanceDeductedCents)}</b></div>
          <div className="flex justify-between border-t pt-2 text-base"><span>Total Payable</span><b>{formatCurrency(settlement.totalPayableCents)}</b></div>
          <div className="flex justify-between"><span>Amount Paid</span><b>{formatCurrency(settlement.amountPaidCents)}</b></div>
          <div className="flex justify-between text-base"><span>Remaining Pending</span><b>{formatCurrency(settlement.remainingPendingCents)}</b></div>
        </div>

        <p className="mt-5 text-sm"><b>Payment Mode:</b> {settlement.paymentMode}</p>
        <p className="mt-1 text-sm"><b>Paid By:</b> {settlement.paidBy}</p>

        <div className="mt-10 grid grid-cols-2 gap-8 text-center text-xs">
          <div className="border-t pt-2">Waitress Signature</div>
          <div className="border-t pt-2">Manager/Admin Signature</div>
        </div>
      </section>
    </main>
  );
}
