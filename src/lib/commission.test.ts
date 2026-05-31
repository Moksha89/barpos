import { describe, expect, it } from "vitest";

import { calculateCommission } from "@/lib/commission";
import { toCents } from "@/lib/money";

describe("calculateCommission", () => {
  it("excludes special drink sales from normal commission", () => {
    const result = calculateCommission({
      eligibleSalesCents: toCents(10000),
      specialDrinkSalesCents: toCents(2000),
      normalCommissionPercent: 25,
    });

    expect(result.normalEligibleSalesCents).toBe(toCents(8000));
    expect(result.normalCommissionCents).toBe(toCents(2000));
    expect(result.specialCommissionCents).toBe(toCents(1000));
    expect(result.totalCommissionCents).toBe(toCents(3000));
  });

  it("never calculates normal sales below zero", () => {
    const result = calculateCommission({
      eligibleSalesCents: toCents(1000),
      specialDrinkSalesCents: toCents(2000),
      normalCommissionPercent: 25,
    });

    expect(result.normalEligibleSalesCents).toBe(0);
    expect(result.specialDrinkSalesCents).toBe(toCents(1000));
    expect(result.totalCommissionCents).toBe(toCents(500));
  });
});
