import { PaymentMode } from "@prisma/client";
import Link from "next/link";

import { AdminCard } from "@/components/admin-card";
import {
  Field,
  SelectInput,
  SubmitButton,
  TextInput,
} from "@/components/form-controls";
import { createStaffAdvance, createStaffSettlement } from "@/lib/actions";
import { prisma } from "@/lib/db";
import { formatCurrency } from "@/lib/money";

export default async function SettlementsPage() {
  const [staff, advances, settlements, ledgerEntries] = await Promise.all([
    prisma.staff.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.staffAdvance.findMany({
      include: { staff: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.staffSettlement.findMany({
      include: { staff: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.staffLedgerEntry.findMany({
      include: { staff: true },
      orderBy: { createdAt: "desc" },
      take: 40,
    }),
  ]);

  return (
    <main className="min-h-screen bg-stone-100 p-4 text-stone-950 sm:p-6">
      <div className="mx-auto grid max-w-7xl gap-5">
        <header>
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-amber-700">
            Settlements
          </p>
          <h1 className="mt-2 text-3xl font-black">Waitress Settlement</h1>
          <p className="mt-2 text-stone-600">
            Pay commission and tips, deduct advances, support partial payments,
            and carry pending balance in the staff ledger.
          </p>
        </header>

        <div className="grid gap-5 lg:grid-cols-2">
          <AdminCard title="Give Staff Advance">
            <form action={createStaffAdvance} className="grid gap-3">
              <Field label="Staff">
                <SelectInput name="staffId" required>
                  {staff.map((member) => (
                    <option key={member.id} value={member.id}>{member.name}</option>
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
              <Field label="Given by">
                <TextInput name="givenBy" defaultValue="Admin" required />
              </Field>
              <Field label="Reason / notes">
                <TextInput name="reason" />
              </Field>
              <SubmitButton>Save advance</SubmitButton>
            </form>
          </AdminCard>

          <AdminCard title="Create Settlement">
            <form action={createStaffSettlement} className="grid gap-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Staff">
                  <SelectInput name="staffId" required>
                    {staff.map((member) => (
                      <option key={member.id} value={member.id}>{member.name}</option>
                    ))}
                  </SelectInput>
                </Field>
                <Field label="Payment mode">
                  <SelectInput name="paymentMode" required>
                    {Object.values(PaymentMode).map((mode) => (
                      <option key={mode} value={mode}>{mode}</option>
                    ))}
                  </SelectInput>
                </Field>
                <Field label="Start date">
                  <TextInput name="startDate" type="date" required />
                </Field>
                <Field label="End date">
                  <TextInput name="endDate" type="date" required />
                </Field>
                <Field label="Advance deduct now">
                  <TextInput name="advanceDeducted" type="number" min="0" step="0.01" defaultValue="0" />
                </Field>
                <Field label="Amount paid now">
                  <TextInput name="amountPaid" type="number" min="0" step="0.01" required />
                </Field>
                <Field label="Paid by">
                  <TextInput name="paidBy" defaultValue="Admin" required />
                </Field>
                <Field label="Notes">
                  <TextInput name="notes" />
                </Field>
              </div>
              <SubmitButton>Create settlement</SubmitButton>
            </form>
          </AdminCard>
        </div>

        <AdminCard title="Recent Settlements" eyebrow={`${settlements.length} settlements`}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="text-xs uppercase text-stone-500">
                <tr>
                  <th className="px-3 py-2">Receipt</th>
                  <th className="px-3 py-2">Staff</th>
                  <th className="px-3 py-2">Commission</th>
                  <th className="px-3 py-2">Tips</th>
                  <th className="px-3 py-2">Advance</th>
                  <th className="px-3 py-2">Paid</th>
                  <th className="px-3 py-2">Pending</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {settlements.map((settlement) => (
                  <tr key={settlement.id}>
                    <td className="px-3 py-3 font-bold">
                      <Link className="text-amber-700 underline" href={`/invoices/settlement/${settlement.id}`}>
                        {settlement.receiptNumber}
                      </Link>
                    </td>
                    <td className="px-3 py-3">{settlement.staff.name}</td>
                    <td className="px-3 py-3">{formatCurrency(settlement.totalCommissionCents)}</td>
                    <td className="px-3 py-3">{formatCurrency(settlement.tipsCents)}</td>
                    <td className="px-3 py-3">{formatCurrency(settlement.advanceDeductedCents)}</td>
                    <td className="px-3 py-3">{formatCurrency(settlement.amountPaidCents)}</td>
                    <td className="px-3 py-3">{formatCurrency(settlement.remainingPendingCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AdminCard>

        <div className="grid gap-5 lg:grid-cols-2">
          <AdminCard title="Advance Balances" eyebrow={`${advances.length} advances`}>
            <div className="grid gap-2">
              {advances.map((advance) => (
                <div key={advance.id} className="rounded-2xl border border-stone-200 p-3 text-sm">
                  <b>{advance.staff.name}</b> · {formatCurrency(advance.amountCents)} · deducted {formatCurrency(advance.deductedCents)} · {advance.deductionStatus}
                </div>
              ))}
            </div>
          </AdminCard>

          <AdminCard title="Staff Ledger" eyebrow={`${ledgerEntries.length} entries`}>
            <div className="grid max-h-[440px] gap-2 overflow-y-auto">
              {ledgerEntries.map((entry) => (
                <div key={entry.id} className="rounded-2xl border border-stone-200 p-3 text-sm">
                  <div className="flex justify-between gap-3">
                    <b>{entry.staff.name}</b>
                    <span>{entry.type.replaceAll("_", " ")}</span>
                  </div>
                  <p className="mt-1 text-stone-600">{entry.description}</p>
                  <p className="mt-1 text-xs">
                    Credit {formatCurrency(entry.creditCents)} · Debit {formatCurrency(entry.debitCents)} · Balance {formatCurrency(entry.balanceCents)}
                  </p>
                </div>
              ))}
            </div>
          </AdminCard>
        </div>
      </div>
    </main>
  );
}
