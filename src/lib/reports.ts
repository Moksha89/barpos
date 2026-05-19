import type { Order, Payment, PaymentMode } from "@prisma/client";

import { calculateProfit } from "@/lib/profit";

export type OrderWithPayments = Order & { payments: Payment[] };

export function summarizeOrders(
  orders: OrderWithPayments[],
  expenseCents: number,
) {
  const grossSalesCents = orders.reduce(
    (total, order) => total + order.subtotalCents,
    0,
  );
  const discountCents = orders.reduce(
    (total, order) => total + order.discountCents,
    0,
  );
  const netSalesCents = orders.reduce(
    (total, order) => total + order.netSalesCents,
    0,
  );
  const tipsCents = orders.reduce((total, order) => total + order.tipCents, 0);
  const complimentaryValueCents = orders.reduce(
    (total, order) => total + order.complimentaryValueCents,
    0,
  );
  const inventoryCostCents = orders.reduce(
    (total, order) => total + order.inventoryCostCents,
    0,
  );
  const staffCommissionCents = orders.reduce(
    (total, order) => total + order.totalCommissionCents,
    0,
  );
  const paymentBreakdown = orders
    .flatMap((order) => order.payments)
    .reduce<Record<PaymentMode, number>>(
      (totals, payment) => {
        totals[payment.mode] += payment.amountCents;
        return totals;
      },
      { CASH: 0, CARD: 0, UPI: 0, ONLINE: 0, SPLIT: 0 },
    );
  const profit = calculateProfit({
    grossSalesCents,
    discountCents,
    inventoryCostCents,
    staffCommissionCents,
    expenseCents,
  });

  return {
    totalBills: orders.length,
    grossSalesCents,
    discountCents,
    netSalesCents,
    tipsCents,
    complimentaryValueCents,
    inventoryCostCents,
    staffCommissionCents,
    expenseCents,
    paymentBreakdown,
    grossProfitCents: profit.grossProfitCents,
    netProfitCents: profit.netProfitCents,
  };
}
