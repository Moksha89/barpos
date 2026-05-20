import { Camera, Plus } from "lucide-react";
import { PaymentMode } from "@prisma/client";

import { AdminCard } from "@/components/admin-card";
import { DateRangeFilter } from "@/components/date-range-filter";
import {
  Field,
  SelectInput,
  SubmitButton,
  TextInput,
} from "@/components/form-controls";
import { StatCard, TableShell } from "@/components/ui";
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
    <div className="app-page text-stone-950">
      <div className="grid gap-4">
        <header className="flex flex-col gap-3 rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-sm lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-gold-dark)]">Expenses</p>
            <h1 className="mt-1 text-lg font-black sm:text-2xl">Expenses</h1>
            <p className="mt-1 text-sm text-stone-600">Add date, amount, reason and bill photo URL. Filter history by any date range.</p>
          </div>
          <DateRangeFilter startDate={range.startDate} endDate={range.endDate} />
        </header>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard accent="red" label="Total expenses" value={formatCurrency(totalExpenseCents)} />
          {[...categoryTotals.entries()].slice(0, 3).map(([category, amount]) => (
            <StatCard key={category} label={category} value={formatCurrency(amount)} />
          ))}
        </section>

        <AdminCard title="Add Expense" eyebrow="Create">
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
            <Field label="Reason">
              <TextInput name="paidTo" placeholder="Food order / maintenance / supplies" required />
            </Field>
            <Field label="Photo URL">
              <TextInput name="attachmentUrl" placeholder="Paste uploaded bill/photo link" />
            </Field>
            <Field label="Notes">
              <TextInput name="notes" placeholder="Optional details" />
            </Field>
            <div className="flex items-end">
              <SubmitButton><Plus className="h-4 w-4" />Add expense</SubmitButton>
            </div>
          </form>
        </AdminCard>

        <AdminCard title="Expense History" eyebrow={`${expenses.length} rows`}>
          <TableShell>
            <table className="premium-table min-w-[720px] text-left">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Category</th>
                  <th className="currency-cell">Amount</th>
                  <th>Mode</th>
                  <th>Reason</th>
                  <th>Photo / Notes</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense) => (
                  <tr key={expense.id}>
                    <td className="font-bold">{expense.expenseDate.toLocaleDateString("en-AE")}</td>
                    <td>{expense.category.name}</td>
                    <td className="currency-cell font-bold">{formatCurrency(expense.amountCents)}</td>
                    <td>{expense.paymentMode}</td>
                    <td>{expense.paidTo}</td>
                    <td>
                      {expense.attachmentUrl ? (
                        <a
                          className="inline-flex items-center gap-1 font-bold text-[var(--color-gold-dark)]"
                          href={expense.attachmentUrl}
                          rel="noreferrer"
                          target="_blank"
                        >
                          <Camera className="h-3.5 w-3.5" />
                          Photo
                        </a>
                      ) : expense.notes ?? "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableShell>
        </AdminCard>
      </div>
    </div>
  );
}
