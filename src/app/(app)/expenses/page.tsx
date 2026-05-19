import { PaymentMode } from "@prisma/client";

import { AdminCard } from "@/components/admin-card";
import {
  Field,
  SelectInput,
  SubmitButton,
  TextInput,
} from "@/components/form-controls";
import { createExpense } from "@/lib/actions";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatCurrency } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function ExpensesPage() {
  await requirePermission("expenses.manage");
  const [categories, expenses] = await Promise.all([
    prisma.expenseCategory.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
    }),
    prisma.expense.findMany({
      include: { category: true },
      orderBy: { expenseDate: "desc" },
      take: 50,
    }),
  ]);

  return (
    <div className="p-4 text-stone-950 sm:p-6">
      <div className="mx-auto grid max-w-7xl gap-5">
        <header>
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-amber-700">
            Expenses
          </p>
          <h1 className="mt-2 text-3xl font-black">Daily Expense Management</h1>
          <p className="mt-2 text-stone-600">
            Expenses are deducted from net profit. Recoverable advances are kept
            in staff ledgers, not treated as restaurant expense.
          </p>
        </header>

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

        <AdminCard title="Recent Expenses" eyebrow={`${expenses.length} rows`}>
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
