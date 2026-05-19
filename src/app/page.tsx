import Link from "next/link";

import { navigation } from "@/lib/navigation";

export default function Home() {
  const stats = [
    { label: "Net Sales", value: "₹95,000", note: "Cash/Card/UPI ready" },
    { label: "Staff Commission", value: "₹13,750", note: "No special double count" },
    { label: "Tips", value: "₹2,000", note: "100% staff payable" },
    { label: "Net Profit", value: "₹41,250", note: "After COGS, commission, expenses" },
  ];

  const phases = [
    "Foundation, Prisma schema, seed data, responsive shell",
    "Configurable admin modules for products, offers, staff, commissions",
    "Fast POS billing with split payments, tips, complimentary starters",
    "Commission settlement, advances, pending balance, staff ledger",
    "Reports, profit/loss, invoice printing, audit logs",
  ];

  return (
    <main className="min-h-screen bg-stone-100 text-stone-950">
      <section className="bg-stone-950 px-4 py-6 text-white sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-amber-300">
              BarPOS
            </p>
            <h1 className="mt-3 max-w-3xl text-4xl font-black tracking-tight sm:text-5xl">
              Responsive restaurant & bar POS foundation
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-stone-300 sm:text-lg">
              Built from scratch with configurable offers, complimentary starters,
              waitress commission, tips, advances, expenses, inventory cost,
              profit/loss, audit logs, and print-ready receipts.
            </p>
          </div>
          <Link
            href="/pos"
            className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-amber-400 px-6 py-3 text-base font-bold text-stone-950 shadow-lg shadow-amber-950/40 transition hover:bg-amber-300"
          >
            Open POS Billing
          </Link>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-4 py-6 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
        {stats.map((stat) => (
          <article
            key={stat.label}
            className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm"
          >
            <p className="text-sm font-medium text-stone-500">{stat.label}</p>
            <p className="mt-2 text-3xl font-black text-stone-950">
              {stat.value}
            </p>
            <p className="mt-2 text-sm text-stone-500">{stat.note}</p>
          </article>
        ))}
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 pb-10 sm:px-6 lg:grid-cols-[280px_1fr] lg:px-8">
        <aside className="rounded-3xl bg-stone-950 p-3 text-white">
          <p className="px-3 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-amber-300">
            Modules
          </p>
          <nav className="grid gap-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex min-h-12 items-center gap-3 rounded-2xl px-3 py-2 text-sm font-semibold text-stone-200 transition hover:bg-white/10 hover:text-white"
                >
                  <Icon className="h-5 w-5 text-amber-300" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <div className="grid gap-6">
          <section className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black">Phase 1 foundation</h2>
            <p className="mt-3 max-w-3xl text-stone-600">
              This first commit establishes the clean project structure,
              database schema, seeded demo data, money/commission/profit helpers,
              and a responsive dark-charcoal/gold admin shell.
            </p>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {phases.map((phase, index) => (
                <div
                  key={phase}
                  className="rounded-2xl border border-stone-200 bg-stone-50 p-4"
                >
                  <p className="text-sm font-bold text-amber-700">
                    Phase {index + 1}
                  </p>
                  <p className="mt-1 text-sm font-medium text-stone-700">
                    {phase}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section
            id="commission-rule"
            className="rounded-3xl border border-amber-200 bg-amber-50 p-6"
          >
            <h2 className="text-2xl font-black text-stone-950">
              Protected commission rule
            </h2>
            <p className="mt-3 max-w-3xl text-stone-700">
              Special drink sales are subtracted from normal eligible sales before
              normal commission is calculated. Tips are separate staff payable
              amounts and never become restaurant revenue or commission base.
            </p>
            <pre className="mt-5 overflow-x-auto rounded-2xl bg-stone-950 p-4 text-sm font-semibold text-amber-200">
{`Normal Commission = (Eligible Sales - Special Drink Sales) × Normal %
Special Commission = Special Drink Sales × Special %
Total Commission = Normal Commission + Special Commission`}
            </pre>
          </section>
        </div>
      </section>
    </main>
  );
}
