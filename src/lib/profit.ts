export type ProfitInput = {
  grossSalesCents: number;
  discountCents: number;
  inventoryCostCents: number;
  staffCommissionCents: number;
  expenseCents: number;
};

export type ProfitResult = {
  netSalesCents: number;
  grossProfitCents: number;
  netProfitCents: number;
};

export function calculateProfit(input: ProfitInput): ProfitResult {
  const netSalesCents = input.grossSalesCents - input.discountCents;
  const grossProfitCents = netSalesCents - input.inventoryCostCents;
  const netProfitCents =
    grossProfitCents - input.staffCommissionCents - input.expenseCents;

  return {
    netSalesCents,
    grossProfitCents,
    netProfitCents,
  };
}
