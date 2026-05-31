import { AdminCard } from "@/components/admin-card";
import {
  Checkbox,
  Field,
  SubmitButton,
  TextInput,
} from "@/components/form-controls";
import {
  createExpenseCategory,
  createPaymentMethod,
  createStaff,
  updateDayPasscode,
  updateInvoiceSettings,
  updatePrinterSettings,
  updateStaffCommission,
  updateUserPassword,
} from "@/lib/actions";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { StaffRole, PaymentMode } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  await requirePermission("settings.manage");
  const [invoiceSetting, printerSetting, dayPasscodeSetting, expenseCategories, roles, paymentMethods, staff, users] =
    await Promise.all([
      prisma.invoiceSetting.findFirst(),
      prisma.printerSetting.findFirst(),
      prisma.dayPasscodeSetting.findFirst(),
      prisma.expenseCategory.findMany({ orderBy: { name: "asc" } }),
      prisma.role.findMany({
        include: { permissions: { include: { permission: true } } },
        orderBy: { label: "asc" },
      }),
      prisma.paymentMethod.findMany({
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      }),
      prisma.staff.findMany({ orderBy: { name: "asc" } }),
      prisma.user.findMany({ include: { role: true }, orderBy: { name: "asc" } }),
    ]);

  return (
    <div className="app-page text-stone-950">
      <div className="grid gap-4">
        <header>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-gold-dark)]">
            Settings
          </p>
          <h1 className="mt-2 text-2xl font-black">Settings</h1>
          <p className="mt-2 text-stone-600">
            Manage passwords, employees, receipt settings and business defaults from one clean module.
          </p>
        </header>

        <div className="grid gap-5 lg:grid-cols-2">
          <AdminCard title="Manage Password">
            <form action={updateUserPassword} className="grid gap-3">
              <Field label="User">
                <select className="min-h-10 rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm font-semibold" name="userId" required>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>{user.name} · {user.role.label}</option>
                  ))}
                </select>
              </Field>
              <Field label="New password">
                <TextInput name="password" type="password" minLength={6} required />
              </Field>
              <SubmitButton>Update password</SubmitButton>
            </form>
          </AdminCard>

          <AdminCard title="Create Employee">
            <form action={createStaff} className="grid gap-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Name">
                  <TextInput name="name" placeholder="Waitress name" required />
                </Field>
                <Field label="Role">
                  <select className="min-h-10 rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm font-semibold" name="role" required>
                    {Object.values(StaffRole).map((role) => (
                      <option key={role} value={role}>{role.replaceAll("_", " ")}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Phone">
                  <TextInput name="phone" />
                </Field>
                <Field label="Fixed salary">
                  <TextInput name="fixedSalary" type="number" min="0" step="0.01" defaultValue="0" />
                </Field>
                <Field label="Normal %">
                  <TextInput name="normalCommissionPercent" type="number" min="0" step="0.01" defaultValue="0" />
                </Field>
                <Field label="Special drink %">
                  <TextInput disabled value="50" />
                </Field>
              </div>
              <Checkbox name="active" label="Active" />
              <SubmitButton>Create employee</SubmitButton>
            </form>
          </AdminCard>
        </div>

        <AdminCard title="Day In / Day Out Passcode">
          <form action={updateDayPasscode} className="grid gap-3 sm:max-w-md">
            <input name="id" type="hidden" value={dayPasscodeSetting?.id ?? ""} />
            <Field label="Passcode">
              <TextInput
                autoComplete="off"
                defaultValue={dayPasscodeSetting?.passcode ?? "1599"}
                inputMode="numeric"
                minLength={4}
                name="passcode"
                required
                type="password"
              />
            </Field>
            <p className="text-xs font-semibold text-stone-500">
              This passcode is required before staff can use Day In or Day Out on Billing.
            </p>
            <SubmitButton>Save day passcode</SubmitButton>
          </form>
        </AdminCard>

        <AdminCard title="Manage Employees" eyebrow={`${staff.length} employees`}>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {staff.map((member) => (
              <article className="rounded-2xl border border-[var(--color-border)] bg-stone-50 p-4" key={member.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-black">{member.name}</h2>
                    <p className="text-xs font-bold text-stone-500">{member.role.replaceAll("_", " ")} · {member.phone ?? "No phone"}</p>
                  </div>
                  <span className="rounded-full bg-white px-2 py-1 text-[11px] font-black text-stone-700">{member.active ? "Active" : "Inactive"}</span>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                  <div><p className="text-xs text-stone-500">Salary</p><b>AED {(member.fixedSalaryCents / 100).toLocaleString("en-AE")}</b></div>
                  <div><p className="text-xs text-stone-500">Normal</p><b>{member.normalCommissionPercent}%</b></div>
                  <div><p className="text-xs text-stone-500">Special</p><b>50%</b></div>
                </div>
                <form action={updateStaffCommission} className="mt-3 grid gap-2">
                  <input name="staffId" type="hidden" value={member.id} />
                  <Field label="Normal commission %">
                    <TextInput
                      name="normalCommissionPercent"
                      type="number"
                      min="0"
                      step="0.01"
                      defaultValue={member.normalCommissionPercent}
                    />
                  </Field>
                  <SubmitButton>Save commission</SubmitButton>
                </form>
              </article>
            ))}
          </div>
        </AdminCard>

        <div className="grid gap-5 lg:grid-cols-2">
          <AdminCard title="Invoice Format">
            <form action={updateInvoiceSettings} className="grid gap-3">
              <input name="id" type="hidden" value={invoiceSetting?.id ?? ""} />
              <Field label="Restaurant/Bar name">
                <TextInput name="restaurantName" defaultValue={invoiceSetting?.restaurantName ?? ""} required />
              </Field>
              <Field label="Address">
                <TextInput name="address" defaultValue={invoiceSetting?.address ?? ""} required />
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Phone">
                  <TextInput name="phone" defaultValue={invoiceSetting?.phone ?? ""} required />
                </Field>
                <Field label="GST/Tax number">
                  <TextInput name="gstNumber" defaultValue={invoiceSetting?.gstNumber ?? ""} />
                </Field>
              </div>
              <Field label="Thank you message">
                <TextInput name="thankYouMessage" defaultValue={invoiceSetting?.thankYouMessage ?? ""} required />
              </Field>
              <SubmitButton>Save invoice settings</SubmitButton>
            </form>
          </AdminCard>

          <AdminCard title="Printer Settings">
            <form action={updatePrinterSettings} className="grid gap-3">
              <input name="id" type="hidden" value={printerSetting?.id ?? ""} />
              <Field label="Invoice printer">
                <TextInput name="invoicePrinter" defaultValue={printerSetting?.invoicePrinter ?? ""} />
              </Field>
              <Field label="Receipt printer">
                <TextInput name="receiptPrinter" defaultValue={printerSetting?.receiptPrinter ?? ""} />
              </Field>
              <Field label="Paper size">
                <TextInput name="paperSize" defaultValue={printerSetting?.paperSize ?? "80mm"} required />
              </Field>
              <SubmitButton>Save printer settings</SubmitButton>
            </form>
          </AdminCard>
        </div>

        <AdminCard title="Payment Modes">
          <form action={createPaymentMethod} className="mb-4 grid gap-3 md:grid-cols-[1fr_150px_120px_auto_auto]">
            <TextInput name="name" placeholder="Card Machine 4 / UPI India" required />
            <select className="min-h-10 rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm font-semibold" name="mode" defaultValue={PaymentMode.CARD}>
              {Object.values(PaymentMode).map((mode) => (
                <option key={mode} value={mode}>{mode}</option>
              ))}
            </select>
            <TextInput name="sortOrder" placeholder="Sort" type="number" />
            <Checkbox name="active" label="Active" />
            <SubmitButton>Add mode</SubmitButton>
          </form>
          <div className="flex flex-wrap gap-2">
            {paymentMethods.map((method) => (
              <span key={method.id} className="rounded-full bg-stone-100 px-3 py-1 text-sm font-semibold">
                {method.name} · {method.mode}{method.active ? "" : " · inactive"}
              </span>
            ))}
          </div>
        </AdminCard>

        <div className="grid gap-5 lg:grid-cols-2">
          <AdminCard title="Expense Categories">
            <form action={createExpenseCategory} className="mb-4 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
              <TextInput name="name" placeholder="Custom category" required />
              <Checkbox name="active" label="Active" />
              <SubmitButton>Add</SubmitButton>
            </form>
            <div className="flex flex-wrap gap-2">
              {expenseCategories.map((category) => (
                <span key={category.id} className="rounded-full bg-stone-100 px-3 py-1 text-sm font-semibold">
                  {category.name}
                </span>
              ))}
            </div>
          </AdminCard>

          <AdminCard title="Roles & Permissions">
            <div className="grid gap-3">
              {roles.map((role) => (
                <article key={role.id} className="rounded-2xl border border-[var(--color-border)] bg-white p-3 shadow-sm">
                  <h2 className="font-black">{role.label}</h2>
                  <p className="mt-1 text-xs text-stone-500">
                    {role.permissions.map((entry) => entry.permission.label).join(" · ")}
                  </p>
                </article>
              ))}
            </div>
          </AdminCard>
        </div>
      </div>
    </div>
  );
}
