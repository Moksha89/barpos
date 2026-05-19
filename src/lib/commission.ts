import { percentOf } from "@/lib/money";

export type CommissionInput = {
  eligibleSalesCents: number;
  specialDrinkSalesCents: number;
  normalCommissionPercent: number;
  specialCommissionPercent: number;
};

export type CommissionResult = {
  normalEligibleSalesCents: number;
  specialDrinkSalesCents: number;
  normalCommissionCents: number;
  specialCommissionCents: number;
  totalCommissionCents: number;
};

export function calculateCommission(input: CommissionInput): CommissionResult {
  const specialDrinkSalesCents = Math.min(
    input.specialDrinkSalesCents,
    input.eligibleSalesCents,
  );
  const normalEligibleSalesCents = Math.max(
    input.eligibleSalesCents - specialDrinkSalesCents,
    0,
  );
  const normalCommissionCents = percentOf(
    normalEligibleSalesCents,
    input.normalCommissionPercent,
  );
  const specialCommissionCents = percentOf(
    specialDrinkSalesCents,
    input.specialCommissionPercent,
  );

  return {
    normalEligibleSalesCents,
    specialDrinkSalesCents,
    normalCommissionCents,
    specialCommissionCents,
    totalCommissionCents: normalCommissionCents + specialCommissionCents,
  };
}
