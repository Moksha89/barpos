import { PaymentMode } from "@prisma/client";

import { AdminCard } from "@/components/admin-card";
import { DateRangeFilter } from "@/components/date-range-filter";
import {
  Field,
  SelectInput,
  SubmitButton,
  TextInput,
} from "@/components/form-controls";
import { createExpense } from "@/lib/actions";
import { requirePermission } from "@/lib/auth";
import { dateRangeFromSearchParams } from "@/lib/date-range";
import { prisma } from "@/lib/db";
import { formatCurrency } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ startDate?: string; endDate?: string }>;
}) {
  await requirePermission("expenses.manage");
  const range = dateRangeFromSearchParams(await searchParams);
  const [categories, expenses] = await Promise.all([
    prisma.expenseCategory.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
    }),
    prisma.expense.findMany({
      where: { expenseDate: { gte: range.start, lt: range.end } },
      include: { category: true },
      orderBy: { expenseDate: "desc" },
    }),
  ]);

  const totalExpenseCents = expenses.reduce((total, expense) => total + expense.amountCents, 0);
  const categoryTotals = new Map<string, number>();
  for (const expense of expenses) {
    categoryTotals.set(expense.category.name, (categoryTotals.get(expense.category.name) ?? 0) + expense.amountCents);
  }

  return (
    <div className="p-2.5 text-stone-950 sm:p-4">
      <div className="mx-auto grid max-w-7xl gap-5">
        <header className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">Expenses</p>
            <h1 className="mt-1 text-lg font-black sm:text-2xl">Daily Expense Management</h1>
            <p className="mt-1 text-sm text-stone-600">Expenses are deducted from P/L. Filter by any date range.</p>
          </div>
          <DateRangeFilter startDate={range.startDate} endDate={range.endDate} />
        </header>

        <section className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <article className="rounded-xl bg-white p-3 shadow-sm">
            <p className="text-xs font-semibold text-stone-500">Total expenses</p>
            <p className="mt-1 text-lg font-black">{formatCurrency(totalExpenseCents)}</p>
          </article>
          {[...categoryTotals.entries()].slice(0, 3).map(([category, amount]) => (
            <article className="rounded-xl bg-white p-3 shadow-sm" key={category}>
              <p className="text-xs font-semibold text-stone-500">{category}</p>
              <p className="mt-1 text-lg font-black">{formatCurrency(amount)}</p>
            </article>
          ))}
        </section>

        <AdminCard title="Add Expense">
          <form action={createExpense} className="grid gap-3 md:grid-cols-3">
            <Field label="Expense date">
              <TextInput name="expenseDate" type="date" required />
            </Field>
            <Field label="Category">
              <SelectInput name="categoryId" required>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </SelectInput>
            </Field>
            <Field label="Amount">
              <TextInput name="amount" type="number" min="0" step="0.01" required />
            </Field>
            <Field label="Payment mode">
              <SelectInput name="paymentMode" required>
                {Object.values(PaymentMode).map((mode) => (
                  <option key={mode} value={mode}>{mode}</option>
                ))}
              </SelectInput>
            </Field>
            <Field label="Paid to">
              <TextInput name="paidTo" required />
            </Field>
            <Field label="Attachment URL optional">
              <TextInput name="attachmentUrl" />
            </Field>
            <Field label="Notes">
              <TextInput name="notes" />
            </Field>
            <div className="flex items-end">
              <SubmitButton>Add expense</SubmitButton>
            </div>
          </form>
        </AdminCard>

        <AdminCard title="Filtered Expenses" eyebrow={`${expenses.length} rows`}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="text-xs uppercase text-stone-500">
                <tr>
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2">Category</th>
                  <th className="px-3 py-2">Amount</th>
                  <th className="px-3 py-2">Mode</th>
                  <th className="px-3 py-2">Paid To</th>
                  <th className="px-3 py-2">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {expenses.map((expense) => (
                  <tr key={expense.id}>
                    <td className="px-3 py-3">{expense.expenseDate.toLocaleDateString("en-AE")}</td>
                    <td className="px-3 py-3">{expense.category.name}</td>
                    <td className="px-3 py-3 font-bold">{formatCurrency(expense.amountCents)}</td>
                    <td className="px-3 py-3">{expense.paymentMode}</td>
                    <td className="px-3 py-3">{expense.paidTo}</td>
                    <td className="px-3 py-3">{expense.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AdminCard>
      </div>
    </div>
  );
}
