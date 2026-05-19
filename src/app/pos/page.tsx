export default function PosPage() {
  return (
    <main className="min-h-screen bg-stone-100 p-4 text-stone-950 sm:p-6">
      <div className="mx-auto grid max-w-7xl gap-4 lg:grid-cols-[1fr_420px]">
        <section className="rounded-3xl bg-white p-5 shadow-sm">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-amber-700">
            POS Billing
          </p>
          <h1 className="mt-2 text-3xl font-black">Fast touch billing</h1>
          <p className="mt-2 text-stone-600">
            Phase 3 will connect item selection, automatic offers, complimentary
            starters, split payments, tips, and customer invoice printing.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              "Food",
              "Beer",
              "Half Bottle",
              "Full Bottle",
              "Cocktails",
              "Special Commission Drinks",
            ].map((category) => (
              <button
                className="min-h-24 rounded-2xl border border-stone-200 bg-stone-50 p-4 text-left font-bold transition hover:border-amber-300 hover:bg-amber-50"
                key={category}
                type="button"
              >
                {category}
              </button>
            ))}
          </div>
        </section>
        <aside className="rounded-3xl bg-stone-950 p-5 text-white shadow-sm">
          <h2 className="text-2xl font-black">Current bill</h2>
          <div className="mt-5 rounded-2xl border border-white/10 p-4 text-sm text-stone-300">
            Cart engine will show selected items, complimentary ₹0 lines,
            discounts, tips, cash/card/UPI split payments, and totals.
          </div>
        </aside>
      </div>
    </main>
  );
}
