import { StaffRole } from "@prisma/client";

import { AdminCard } from "@/components/admin-card";
import {
  Checkbox,
  Field,
  SelectInput,
  SubmitButton,
  TextInput,
} from "@/components/form-controls";
import { createStaff } from "@/lib/actions";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatCurrency } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function StaffPage() {
  await requirePermission("staff.manage");
  const staff = await prisma.staff.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div className="p-4 text-stone-950 sm:p-6">
      <div className="mx-auto grid max-w-7xl gap-5">
        <header>
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-amber-700">
            Admin
          </p>
          <h1 className="mt-2 text-3xl font-black">Staff & Waitress Profiles</h1>
          <p className="mt-2 text-stone-600">
            Configure salary, normal commission, special drink commission, roles,
            and active status.
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
                <TextInput name="specialCommissionPercent" type="number" min="0" step="0.01" defaultValue="0" />
              </Field>
            </div>
            <Checkbox name="active" label="Active" />
            <SubmitButton>Add staff</SubmitButton>
          </form>
        </AdminCard>

        <AdminCard title="Configured Staff" eyebrow={`${staff.length} staff`}>
          <div className="grid gap-3 md:grid-cols-2">
            {staff.map((member) => (
              <article key={member.id} className="rounded-2xl border border-stone-200 p-4">
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
                    <p className="font-bold">{member.specialCommissionPercent}%</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </AdminCard>
      </div>
    </div>
  );
}
