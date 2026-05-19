import { AdminCard } from "@/components/admin-card";
import {
  Checkbox,
  Field,
  SelectInput,
  SubmitButton,
  TextInput,
} from "@/components/form-controls";
import { createCommissionRule } from "@/lib/actions";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function CommissionPage() {
  await requirePermission("commission.manage");
  const [rules, staff, categories, items] = await Promise.all([
    prisma.staffCommissionRule.findMany({
      include: {
        staff: true,
        categories: { include: { category: true } },
        items: { include: { item: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.staff.findMany({ orderBy: { name: "asc" } }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.item.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="p-4 text-stone-950 sm:p-6">
      <div className="mx-auto grid max-w-7xl gap-5">
        <header>
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-amber-700">
            Admin
          </p>
          <h1 className="mt-2 text-3xl font-black">Commission Rules</h1>
          <p className="mt-2 text-stone-600">
            Configure staff/category/item eligibility. Engine excludes special
            drinks from normal commission before applying the special rate.
          </p>
        </header>

        <AdminCard title="Create Commission Rule">
          <form action={createCommissionRule} className="grid gap-4">
            <div className="grid gap-3 md:grid-cols-4">
              <Field label="Rule name">
                <TextInput name="name" placeholder="25% waitress alcohol rule" required />
              </Field>
              <Field label="Staff optional">
                <SelectInput name="staffId">
                  <option value="">Default / all eligible staff</option>
                  {staff.map((member) => (
                    <option key={member.id} value={member.id}>{member.name}</option>
                  ))}
                </SelectInput>
              </Field>
              <Field label="Normal commission %">
                <TextInput name="normalCommissionPercent" type="number" min="0" step="0.01" required />
              </Field>
              <Field label="Special commission %">
                <TextInput name="specialCommissionPercent" type="number" min="0" step="0.01" required />
              </Field>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <fieldset className="rounded-2xl border border-stone-200 p-3">
                <legend className="px-2 text-sm font-bold">Eligible categories</legend>
                <div className="grid gap-2 sm:grid-cols-2">
                  {categories.map((category) => (
                    <label key={category.id} className="flex gap-2 text-sm">
                      <input name="categoryIds" type="checkbox" value={category.id} />
                      {category.name}
                    </label>
                  ))}
                </div>
              </fieldset>
              <fieldset className="rounded-2xl border border-stone-200 p-3">
                <legend className="px-2 text-sm font-bold">Special/selected items</legend>
                <div className="grid gap-2 sm:grid-cols-2">
                  {items.map((item) => (
                    <label key={item.id} className="flex gap-2 text-sm">
                      <input name="itemIds" type="checkbox" value={item.id} />
                      {item.name}
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>
            <Checkbox name="active" label="Active" />
            <SubmitButton>Create rule</SubmitButton>
          </form>
        </AdminCard>

        <AdminCard title="Configured Rules" eyebrow={`${rules.length} rules`}>
          <div className="grid gap-3">
            {rules.map((rule) => (
              <article key={rule.id} className="rounded-2xl border border-stone-200 p-4">
                <h2 className="font-black">{rule.name}</h2>
                <p className="mt-1 text-sm text-stone-600">
                  Staff: {rule.staff?.name ?? "Default"} · Normal {rule.normalCommissionPercent}% · Special {rule.specialCommissionPercent}%
                </p>
                <p className="mt-2 text-xs text-stone-500">
                  Categories: {rule.categories.map((entry) => entry.category.name).join(", ") || "none"} · Items: {rule.items.map((entry) => entry.item.name).join(", ") || "none"}
                </p>
              </article>
            ))}
          </div>
        </AdminCard>
      </div>
    </div>
  );
}
