import { StaffRole } from "@prisma/client";

import { AdminCard } from "@/components/admin-card";
import {
  Checkbox,
  Field,
  SelectInput,
  SubmitButton,
  TextInput,
} from "@/components/form-controls";
import { createStaff, updateStaffCommission } from "@/lib/actions";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatCurrency } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function StaffPage() {
  await requirePermission("staff.manage");
  const staff = await prisma.staff.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div className="app-page text-stone-950">
      <div className="grid gap-4">
        <header>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-gold-dark)]">
            Admin
          </p>
          <h1 className="mt-2 text-2xl font-black">Staff & Waitress Profiles</h1>
          <p className="mt-2 text-stone-600">
            Configure employees and each waitress&apos;s normal commission slab.
            Special-drink commission is fixed at 50% for all staff.
          </p>
        </header>

        <AdminCard title="Add Staff">
          <form action={createStaff} className="grid gap-3">
            <div className="grid gap-3 md:grid-cols-3">
              <Field label="Staff name">
                <TextInput name="name" placeholder="Priya" required />
              </Field>
              <Field label="Role">
                <SelectInput name="role" required>
                  {Object.values(StaffRole).map((role) => (
                    <option key={role} value={role}>{role.replaceAll("_", " ")}</option>
                  ))}
                </SelectInput>
              </Field>
              <Field label="Phone">
                <TextInput name="phone" placeholder="9000000000" />
              </Field>
              <Field label="Fixed salary">
                <TextInput name="fixedSalary" type="number" min="0" step="0.01" defaultValue="0" />
              </Field>
              <Field label="Normal commission %">
                <TextInput name="normalCommissionPercent" type="number" min="0" step="0.01" defaultValue="0" />
              </Field>
              <Field label="Special drink commission %">
                <TextInput disabled value="50" />
              </Field>
            </div>
            <Checkbox name="active" label="Active" />
            <SubmitButton>Add staff</SubmitButton>
          </form>
        </AdminCard>

        <AdminCard title="Configured Staff" eyebrow={`${staff.length} staff`}>
          <div className="grid gap-3 md:grid-cols-2">
            {staff.map((member) => (
              <article key={member.id} className="rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-lg font-black">{member.name}</h2>
                  <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-bold">
                    {member.role.replaceAll("_", " ")}
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-stone-500">Salary</p>
                    <p className="font-bold">{formatCurrency(member.fixedSalaryCents)}</p>
                  </div>
                  <div>
                    <p className="text-stone-500">Normal</p>
                    <p className="font-bold">{member.normalCommissionPercent}%</p>
                  </div>
                  <div>
                    <p className="text-stone-500">Special</p>
                    <p className="font-bold">50%</p>
                  </div>
                </div>
                <form action={updateStaffCommission} className="mt-4 grid gap-2 rounded-2xl bg-stone-50 p-3">
                  <input name="staffId" type="hidden" value={member.id} />
                  <Field label="Normal commission slab %">
                    <TextInput
                      name="normalCommissionPercent"
                      type="number"
                      min="0"
                      step="0.01"
                      defaultValue={member.normalCommissionPercent}
                    />
                  </Field>
                  <p className="text-xs font-semibold text-stone-500">
                    Special drinks stay fixed at 50% for everyone.
                  </p>
                  <SubmitButton>Save commission</SubmitButton>
                </form>
              </article>
            ))}
          </div>
        </AdminCard>
      </div>
    </div>
  );
}
