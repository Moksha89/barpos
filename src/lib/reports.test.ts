import { PaymentMode } from "@prisma/client";
import { describe, expect, it } from "vitest";

import { toCents } from "@/lib/money";
import { summarizeOrders } from "@/lib/reports";

describe("summarizeOrders", () => {
  it("excludes tips from net sales and deducts expenses from net profit", () => {
    const summary = summarizeOrders(
      [
        {
          id: "order-1",
          billNumber: "BILL-1",
          tableNumber: "T1",
          customerName: null,
          staffId: "staff-1",
          cashierId: null,
          status: "PAID",
          subtotalCents: toCents(10000),
          discountCents: toCents(500),
          taxCents: 0,
          netSalesCents: toCents(9500),
          tipCents: toCents(500),
          totalCollectedCents: toCents(10000),
          complimentaryValueCents: toCents(350),
          inventoryCostCents: toCents(3500),
          normalCommissionSalesCents: toCents(8000),
          specialCommissionSalesCents: toCents(1500),
          normalCommissionCents: toCents(2000),
          specialCommissionCents: toCents(750),
          totalCommissionCents: toCents(2750),
          paidAt: new Date(),
          voidReason: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          payments: [
            {
              id: "payment-1",
              orderId: "order-1",
              mode: PaymentMode.CASH,
              amountCents: toCents(6000),
              reference: null,
              createdAt: new Date(),
            },
            {
              id: "payment-2",
              orderId: "order-1",
              mode: PaymentMode.CARD,
              amountCents: toCents(4000),
              reference: null,
              createdAt: new Date(),
            },
          ],
        },
      ],
      toCents(1000),
    );

    expect(summary.netSalesCents).toBe(toCents(9500));
    expect(summary.tipsCents).toBe(toCents(500));
    expect(summary.paymentBreakdown.CASH).toBe(toCents(6000));
    expect(summary.paymentBreakdown.CARD).toBe(toCents(4000));
    expect(summary.grossProfitCents).toBe(toCents(6000));
    expect(summary.netProfitCents).toBe(toCents(2250));
  });
});
