import { describe, expect, it } from "vitest";

import { toCents } from "@/lib/money";
import { calculateProfit } from "@/lib/profit";

describe("calculateProfit", () => {
  it("deducts inventory cost, staff commission, and expenses from sales", () => {
    const result = calculateProfit({
      grossSalesCents: toCents(100000),
      discountCents: toCents(5000),
      inventoryCostCents: toCents(35000),
      staffCommissionCents: toCents(13750),
      expenseCents: toCents(5000),
    });

    expect(result.netSalesCents).toBe(toCents(95000));
    expect(result.grossProfitCents).toBe(toCents(60000));
    expect(result.netProfitCents).toBe(toCents(41250));
  });
});
