import { requirePermission } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function SettlementInvoicePage() {
  await requirePermission("settlements.manage");
  return (
    <main className="min-h-screen bg-white p-6 text-stone-950">
      <section className="mx-auto max-w-lg rounded-xl border border-stone-200 p-6">
        <h1 className="text-center text-xl font-black">
          Settlement Receipt Preview
        </h1>
        <p className="mt-3 text-center text-sm text-stone-600">
          Phase 4 will render normal sales, special drink sales, commissions,
          tips, pending balance, advance deductions, paid amount, and signature
          lines.
        </p>
      </section>
    </main>
  );
}
