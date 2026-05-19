import { AdminCard } from "@/components/admin-card";
import { prisma } from "@/lib/db";
import { formatCurrency } from "@/lib/money";
import { summarizeOrders } from "@/lib/reports";

export default async function ReportsPage() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [
    orders,
    expenses,
    staff,
    tips,
    inventoryTransactions,
    complimentaryItems,
  ] = await Promise.all([
    prisma.order.findMany({
      where: { status: "PAID", paidAt: { gte: today, lt: tomorrow } },
      include: { payments: true, staff: true },
      orderBy: { paidAt: "desc" },
    }),
    prisma.expense.findMany({
      where: { expenseDate: { gte: today, lt: tomorrow } },
      include: { category: true },
      orderBy: { expenseDate: "desc" },
    }),
    prisma.staff.findMany({
      include: {
        orders: {
          where: { status: "PAID", paidAt: { gte: today, lt: tomorrow } },
        },
      },
      orderBy: { name: "asc" },
    }),
    prisma.tip.findMany({
      where: { createdAt: { gte: today, lt: tomorrow } },
      include: { staff: true, order: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.inventoryTransaction.findMany({
      where: { createdAt: { gte: today, lt: tomorrow } },
      include: { item: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.orderItem.findMany({
      where: {
        isComplimentary: true,
        order: { paidAt: { gte: today, lt: tomorrow }, status: "PAID" },
      },
      include: { item: true, offer: true, order: { include: { staff: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const expenseCents = expenses.reduce(
    (total, expense) => total + expense.amountCents,
    0,
  );
  const summary = summarizeOrders(orders, expenseCents);
  const paymentCards = Object.entries(summary.paymentBreakdown);

  return (
    <main className="min-h-screen bg-stone-100 p-4 text-stone-950 sm:p-6">
      <div className="mx-auto grid max-w-7xl gap-5">
        <header>
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-amber-700">
            Reports
          </p>
          <h1 className="mt-2 text-3xl font-black">Daily Business Reports</h1>
          <p className="mt-2 text-stone-600">
            Today&apos;s sales, payment modes, tips, complimentary cost,
            inventory cost, commission, expenses, and profit/loss.
          </p>
        </header>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Total Bills", String(summary.totalBills)],
            ["Gross Sales", formatCurrency(summary.grossSalesCents)],
            ["Net Sales", formatCurrency(summary.netSalesCents)],
            ["Tips Collected", formatCurrency(summary.tipsCents)],
            ["Complimentary Value", formatCurrency(summary.complimentaryValueCents)],
            ["Inventory Cost", formatCurrency(summary.inventoryCostCents)],
            ["Staff Commission", formatCurrency(summary.staffCommissionCents)],
            ["Net Profit", formatCurrency(summary.netProfitCents)],
          ].map(([label, value]) => (
            <article key={label} className="rounded-3xl bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-stone-500">{label}</p>
              <p className="mt-2 text-2xl font-black">{value}</p>
            </article>
          ))}
        </section>

        <div className="grid gap-5 lg:grid-cols-2">
          <AdminCard title="Payment Mode Breakdown">
            <div className="grid gap-3 sm:grid-cols-2">
              {paymentCards.map(([mode, amount]) => (
                <div key={mode} className="rounded-2xl bg-stone-50 p-4">
                  <p className="text-sm font-semibold text-stone-500">{mode}</p>
                  <p className="mt-1 text-xl font-black">{formatCurrency(amount)}</p>
                </div>
              ))}
            </div>
          </AdminCard>

          <AdminCard title="Profit / Loss">
            <div className="grid gap-2 text-sm">
              <div className="flex justify-between"><span>Gross Sales</span><b>{formatCurrency(summary.grossSalesCents)}</b></div>
              <div className="flex justify-between"><span>Discounts</span><b>{formatCurrency(summary.discountCents)}</b></div>
              <div className="flex justify-between"><span>Net Sales</span><b>{formatCurrency(summary.netSalesCents)}</b></div>
              <div className="flex justify-between"><span>Inventory Cost</span><b>{formatCurrency(summary.inventoryCostCents)}</b></div>
              <div className="flex justify-between"><span>Gross Profit</span><b>{formatCurrency(summary.grossProfitCents)}</b></div>
              <div className="flex justify-between"><span>Staff Commission</span><b>{formatCurrency(summary.staffCommissionCents)}</b></div>
              <div className="flex justify-between"><span>Expenses</span><b>{formatCurrency(summary.expenseCents)}</b></div>
              <div className="flex justify-between border-t pt-2 text-base"><span>Net Profit</span><b>{formatCurrency(summary.netProfitCents)}</b></div>
            </div>
          </AdminCard>
        </div>

        <AdminCard title="Waitress Daily Commission Report">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="text-xs uppercase text-stone-500">
                <tr>
                  <th className="px-3 py-2">Waitress</th>
                  <th className="px-3 py-2">Bills</th>
                  <th className="px-3 py-2">Normal Sales</th>
                  <th className="px-3 py-2">Special Sales</th>
                  <th className="px-3 py-2">Normal Commission</th>
                  <th className="px-3 py-2">Special Commission</th>
                  <th className="px-3 py-2">Tips</th>
                  <th className="px-3 py-2">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {staff.map((member) => {
                  const memberOrders = member.orders;
                  const totals = memberOrders.reduce(
                    (acc, order) => ({
                      normalSales: acc.normalSales + order.normalCommissionSalesCents,
                      specialSales: acc.specialSales + order.specialCommissionSalesCents,
                      normalCommission: acc.normalCommission + order.normalCommissionCents,
                      specialCommission: acc.specialCommission + order.specialCommissionCents,
                      tips: acc.tips + order.tipCents,
                    }),
                    { normalSales: 0, specialSales: 0, normalCommission: 0, specialCommission: 0, tips: 0 },
                  );
                  return (
                    <tr key={member.id}>
                      <td className="px-3 py-3 font-bold">{member.name}</td>
                      <td className="px-3 py-3">{memberOrders.length}</td>
                      <td className="px-3 py-3">{formatCurrency(totals.normalSales)}</td>
                      <td className="px-3 py-3">{formatCurrency(totals.specialSales)}</td>
                      <td className="px-3 py-3">{formatCurrency(totals.normalCommission)}</td>
                      <td className="px-3 py-3">{formatCurrency(totals.specialCommission)}</td>
                      <td className="px-3 py-3">{formatCurrency(totals.tips)}</td>
                      <td className="px-3 py-3">{formatCurrency(totals.normalCommission + totals.specialCommission + totals.tips)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </AdminCard>

        <div className="grid gap-5 lg:grid-cols-2">
          <AdminCard title="Tips Report" eyebrow={`${tips.length} tips`}>
            <div className="grid gap-2">
              {tips.map((tip) => (
                <div key={tip.id} className="rounded-2xl border border-stone-200 p-3 text-sm">
                  <b>{tip.staff.name}</b> · {tip.order.billNumber} · {formatCurrency(tip.amountCents)} · {tip.paymentMode}
                </div>
              ))}
            </div>
          </AdminCard>

          <AdminCard title="Expenses Report" eyebrow={`${expenses.length} expenses`}>
            <div className="grid gap-2">
              {expenses.map((expense) => (
                <div key={expense.id} className="rounded-2xl border border-stone-200 p-3 text-sm">
                  <b>{expense.category.name}</b> · {formatCurrency(expense.amountCents)} · {expense.paymentMode} · {expense.paidTo}
                </div>
              ))}
            </div>
          </AdminCard>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <AdminCard title="Inventory Cost Report" eyebrow={`${inventoryTransactions.length} transactions`}>
            <div className="grid max-h-[420px] gap-2 overflow-y-auto">
              {inventoryTransactions.map((transaction) => (
                <div key={transaction.id} className="rounded-2xl border border-stone-200 p-3 text-sm">
                  <b>{transaction.item.name}</b> · Qty {Math.abs(transaction.quantityChange)} · Cost {formatCurrency(transaction.totalCostCents)} · {transaction.type}
                </div>
              ))}
            </div>
          </AdminCard>

          <AdminCard title="Offer / Complimentary Report" eyebrow={`${complimentaryItems.length} items`}>
            <div className="grid max-h-[420px] gap-2 overflow-y-auto">
              {complimentaryItems.map((line) => (
                <div key={line.id} className="rounded-2xl border border-stone-200 p-3 text-sm">
                  <b>{line.offer?.name ?? "Manual complimentary"}</b>
                  <p className="text-stone-600">
                    {line.order.billNumber} · {line.item.name} · Cost {formatCurrency(line.totalCostCents)} · {line.order.staff.name}
                  </p>
                </div>
              ))}
            </div>
          </AdminCard>
        </div>
      </div>
    </main>
  );
}
