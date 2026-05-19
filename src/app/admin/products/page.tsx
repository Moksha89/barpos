import { AdminCard } from "@/components/admin-card";
import {
  Checkbox,
  Field,
  SelectInput,
  SubmitButton,
  TextInput,
} from "@/components/form-controls";
import { createCategory, createItem } from "@/lib/actions";
import { prisma } from "@/lib/db";
import { formatCurrency } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const [categories, items] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.item.findMany({
      include: { category: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <main className="min-h-screen bg-stone-100 p-4 text-stone-950 sm:p-6">
      <div className="mx-auto grid max-w-7xl gap-5">
        <header>
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-amber-700">
            Admin
          </p>
          <h1 className="mt-2 text-3xl font-black">Products & Inventory</h1>
          <p className="mt-2 text-stone-600">
            Configure sell price, purchase cost, stock, tax, commission flags,
            special drinks, and complimentary eligibility.
          </p>
        </header>

        <div className="grid gap-5 lg:grid-cols-2">
          <AdminCard title="Add Category" description="Create configurable product groups for POS tabs and rules.">
            <form action={createCategory} className="grid gap-3">
              <Field label="Category name">
                <TextInput name="name" placeholder="Beer" required />
              </Field>
              <Field label="Type">
                <TextInput name="type" placeholder="alcohol / food" required />
              </Field>
              <div className="grid gap-2 sm:grid-cols-3">
                <Checkbox name="commissionEligible" label="Commission" defaultChecked={false} />
                <Checkbox name="complimentaryEligible" label="Complimentary" defaultChecked={false} />
                <Checkbox name="active" label="Active" />
              </div>
              <SubmitButton>Add category</SubmitButton>
            </form>
          </AdminCard>

          <AdminCard title="Add Item" description="All business behavior is driven by item configuration.">
            <form action={createItem} className="grid gap-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Item name">
                  <TextInput name="name" placeholder="Kingfisher Beer Bucket" required />
                </Field>
                <Field label="SKU">
                  <TextInput name="sku" placeholder="BEER-BUCKET" />
                </Field>
                <Field label="Category">
                  <SelectInput name="categoryId" required>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </SelectInput>
                </Field>
                <Field label="Unit type">
                  <TextInput name="unitType" defaultValue="pcs" required />
                </Field>
                <Field label="Selling price">
                  <TextInput name="sellingPrice" type="number" min="0" step="0.01" required />
                </Field>
                <Field label="Purchase cost">
                  <TextInput name="purchaseCost" type="number" min="0" step="0.01" required />
                </Field>
                <Field label="Stock quantity">
                  <TextInput name="stockQuantity" type="number" min="0" step="0.01" defaultValue="0" required />
                </Field>
                <Field label="Tax %">
                  <TextInput name="taxPercent" type="number" min="0" step="0.01" defaultValue="0" />
                </Field>
              </div>
              <div className="grid gap-2 sm:grid-cols-4">
                <Checkbox name="commissionEligible" label="Commission" defaultChecked={false} />
                <Checkbox name="specialCommissionEligible" label="Special drink" defaultChecked={false} />
                <Checkbox name="complimentaryEligible" label="Complimentary" defaultChecked={false} />
                <Checkbox name="active" label="Active" />
              </div>
              <SubmitButton>Add item</SubmitButton>
            </form>
          </AdminCard>
        </div>

        <AdminCard title="Configured Items" eyebrow={`${items.length} items`}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="text-xs uppercase text-stone-500">
                <tr>
                  <th className="px-3 py-2">Item</th>
                  <th className="px-3 py-2">Category</th>
                  <th className="px-3 py-2">Sell</th>
                  <th className="px-3 py-2">Cost</th>
                  <th className="px-3 py-2">Stock</th>
                  <th className="px-3 py-2">Flags</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-3 py-3 font-bold">{item.name}</td>
                    <td className="px-3 py-3">{item.category.name}</td>
                    <td className="px-3 py-3">{formatCurrency(item.sellingPriceCents)}</td>
                    <td className="px-3 py-3">{formatCurrency(item.purchaseCostCents)}</td>
                    <td className="px-3 py-3">{item.stockQuantity} {item.unitType}</td>
                    <td className="px-3 py-3 text-xs">
                      {[
                        item.commissionEligible ? "commission" : null,
                        item.specialCommissionEligible ? "special" : null,
                        item.complimentaryEligible ? "complimentary" : null,
                        item.active ? "active" : "inactive",
                      ].filter(Boolean).join(" / ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AdminCard>
      </div>
    </main>
  );
}
