import { AdminCard } from "@/components/admin-card";
import {
  Checkbox,
  Field,
  SelectInput,
  SubmitButton,
  TextInput,
} from "@/components/form-controls";
import { PageHeader, StatusBadge, TableShell } from "@/components/ui";
import { createCategory, createItem } from "@/lib/actions";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatCurrency } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  await requirePermission("products.manage");
  const [categories, items] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.item.findMany({
      include: { category: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="app-page text-stone-950">
      <div className="grid gap-4">
        <PageHeader
          eyebrow="Admin"
          title="Products & Inventory"
          subtitle="Configure sell price, purchase cost, stock, tax, commission flags, special drinks, and complimentary eligibility."
        />

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
          <div className="desktop-table-only">
          <TableShell>
            <table className="premium-table min-w-[900px] text-left">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Category</th>
                  <th className="currency-cell">Sell</th>
                  <th className="currency-cell">Cost</th>
                  <th>Stock</th>
                  <th>Flags</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="font-bold">{item.name}</td>
                    <td>{item.category.name}</td>
                    <td className="currency-cell font-bold">{formatCurrency(item.sellingPriceCents)}</td>
                    <td className="currency-cell">{formatCurrency(item.purchaseCostCents)}</td>
                    <td>{item.stockQuantity} {item.unitType}</td>
                    <td>
                      <div className="flex flex-wrap gap-1">
                        {item.commissionEligible ? <StatusBadge tone="gold">commission</StatusBadge> : null}
                        {item.specialCommissionEligible ? <StatusBadge tone="warning">special</StatusBadge> : null}
                        {item.complimentaryEligible ? <StatusBadge tone="success">complimentary</StatusBadge> : null}
                        <StatusBadge tone={item.active ? "success" : "danger"}>{item.active ? "active" : "inactive"}</StatusBadge>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableShell>
          </div>
          <div className="mobile-card-list">
            {items.map((item) => (
              <article className="rounded-2xl border border-[var(--color-border)] bg-white p-3 shadow-sm" key={item.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-black">{item.name}</p>
                    <p className="text-xs text-stone-500">{item.category.name} · {item.stockQuantity} {item.unitType}</p>
                  </div>
                  <b className="text-[var(--color-gold-dark)]">{formatCurrency(item.sellingPriceCents)}</b>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {item.commissionEligible ? <StatusBadge tone="gold">commission</StatusBadge> : null}
                  {item.specialCommissionEligible ? <StatusBadge tone="warning">special</StatusBadge> : null}
                  {item.complimentaryEligible ? <StatusBadge tone="success">complimentary</StatusBadge> : null}
                  <StatusBadge tone={item.active ? "success" : "danger"}>{item.active ? "active" : "inactive"}</StatusBadge>
                </div>
              </article>
            ))}
          </div>
        </AdminCard>
      </div>
    </div>
  );
}
