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
  updateInvoiceSettings,
  updatePrinterSettings,
} from "@/lib/actions";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PaymentMode } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  await requirePermission("settings.manage");
  const [invoiceSetting, printerSetting, expenseCategories, roles, paymentMethods] =
    await Promise.all([
      prisma.invoiceSetting.findFirst(),
      prisma.printerSetting.findFirst(),
      prisma.expenseCategory.findMany({ orderBy: { name: "asc" } }),
      prisma.role.findMany({
        include: { permissions: { include: { permission: true } } },
        orderBy: { label: "asc" },
      }),
      prisma.paymentMethod.findMany({
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      }),
    ]);

  return (
    <div className="p-4 text-stone-950 sm:p-6">
      <div className="mx-auto grid max-w-7xl gap-5">
        <header>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-700">
            Admin
          </p>
          <h1 className="mt-2 text-3xl font-black">System Settings</h1>
          <p className="mt-2 text-stone-600">
            Manage invoice format, printer settings, expense categories, roles,
            permissions, and business defaults.
          </p>
        </header>

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
            <select className="min-h-10 rounded-xl border border-stone-200 bg-white px-3 text-sm font-semibold" name="mode" defaultValue={PaymentMode.CARD}>
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
                <article key={role.id} className="rounded-xl border border-stone-200 p-3">
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
