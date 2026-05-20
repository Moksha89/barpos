import { PackagePlus } from "lucide-react";

import { AdminCard } from "@/components/admin-card";
import {
  Checkbox,
  Field,
  SelectInput,
  SubmitButton,
  TextInput,
} from "@/components/form-controls";
import { PageHeader, StatusBadge, TableShell } from "@/components/ui";
import { createCategory, createInventoryPurchase, createItem } from "@/lib/actions";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatCurrency } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  await requirePermission("products.manage");
  const [categories, items, inventoryTransactions] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.item.findMany({
      include: { category: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.inventoryTransaction.findMany({
      include: { item: true },
      orderBy: { createdAt: "desc" },
      take: 25,
    }),
  ]);
  const totalStockValueCents = items.reduce(
    (total, item) => total + Math.round(item.stockQuantity * item.purchaseCostCents),
    0,
  );
  const lowStockCount = items.filter((item) => item.stockQuantity <= 5).length;

  return (
    <div className="app-page text-stone-950">
      <div className="grid gap-4">
        <PageHeader
          eyebrow="Inventory"
          title="Inventory"
          subtitle="Add stock, create products and keep only essential item, stock, cost and POS flags visible."
        />

        <section className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-sm">
            <p className="text-xs font-black uppercase tracking-wide text-stone-500">Items</p>
            <p className="mt-1 text-2xl font-black">{items.length}</p>
          </div>
          <div className="rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-sm">
            <p className="text-xs font-black uppercase tracking-wide text-stone-500">Low stock</p>
            <p className="mt-1 text-2xl font-black text-amber-700">{lowStockCount}</p>
          </div>
          <div className="rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-sm">
            <p className="text-xs font-black uppercase tracking-wide text-stone-500">Stock value</p>
            <p className="mt-1 text-2xl font-black">{formatCurrency(totalStockValueCents)}</p>
          </div>
        </section>

        <div className="grid gap-5 lg:grid-cols-2">
          <AdminCard title="Add Inventory" description="Select an existing item and add purchased quantity to stock.">
            <form action={createInventoryPurchase} className="grid gap-3">
              <Field label="Item">
                <SelectInput name="itemId" required>
                  {items.map((item) => (
                    <option key={item.id} value={item.id}>{item.name} · Stock {item.stockQuantity} {item.unitType}</option>
                  ))}
                </SelectInput>
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Quantity">
                  <TextInput name="quantity" type="number" min="0" step="0.01" required />
                </Field>
                <Field label="Unit cost">
                  <TextInput name="unitCost" type="number" min="0" step="0.01" required />
                </Field>
              </div>
              <Field label="Reason / supplier">
                <TextInput name="notes" placeholder="Purchase / opening stock" />
              </Field>
              <SubmitButton><PackagePlus className="h-4 w-4" />Add inventory</SubmitButton>
            </form>
          </AdminCard>

          <AdminCard title="Add Category" description="Create POS product groups and rules.">
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

        </div>

        <AdminCard title="Add Item" description="Create new POS sale item with price, cost, stock and commission flags.">
          <form action={createItem} className="grid gap-3">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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

        <AdminCard title="Inventory History" eyebrow={`${inventoryTransactions.length} recent`}>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {inventoryTransactions.map((transaction) => (
              <article className="rounded-xl border border-[var(--color-border)] bg-stone-50 p-3 text-sm" key={transaction.id}>
                <div className="flex items-start justify-between gap-3">
                  <b>{transaction.item.name}</b>
                  <span className={transaction.quantityChange > 0 ? "text-green-700" : "text-red-700"}>{transaction.quantityChange > 0 ? "+" : ""}{transaction.quantityChange}</span>
                </div>
                <p className="mt-1 text-xs text-stone-500">{transaction.type} · {formatCurrency(transaction.totalCostCents)} · {transaction.createdAt.toLocaleDateString("en-AE")}</p>
              </article>
            ))}
            {inventoryTransactions.length === 0 ? <p className="text-sm text-stone-500">No inventory history yet.</p> : null}
          </div>
        </AdminCard>

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
