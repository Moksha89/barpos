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
import {
  adjustInventoryStock,
  createCategory,
  createItem,
  updateItem,
} from "@/lib/actions";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatCurrency } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  await requirePermission("products.manage");
  const selectedCategoryId = (await searchParams).category ?? "all";
  const [categories, items, inventoryTransactions] = await Promise.all([
    prisma.category.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.item.findMany({
      where: { active: true },
      include: { category: true },
      orderBy: [{ category: { name: "asc" } }, { name: "asc" }],
    }),
    prisma.inventoryTransaction.findMany({
      where: { item: { active: true } },
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
  const filteredItems =
    selectedCategoryId === "all"
      ? items
      : items.filter((item) => item.categoryId === selectedCategoryId);

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
          <AdminCard title="Stock In / Stock Out" description="Add purchases or remove damaged/returned stock.">
            <form action={adjustInventoryStock} className="grid gap-3">
              <Field label="Item">
                <SelectInput name="itemId" required>
                  {items.map((item) => (
                    <option key={item.id} value={item.id}>{item.name} · Stock {item.stockQuantity} {item.unitType}</option>
                  ))}
                </SelectInput>
              </Field>
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="Action">
                  <SelectInput name="direction" required>
                    <option value="IN">Stock in</option>
                    <option value="OUT">Stock out</option>
                  </SelectInput>
                </Field>
                <Field label="Quantity">
                  <TextInput name="quantity" type="number" min="0.01" step="0.01" required />
                </Field>
                <Field label="Unit cost">
                  <TextInput name="unitCost" type="number" min="0" step="0.01" defaultValue="0" required />
                </Field>
              </div>
              <Field label="Reason / supplier">
                <TextInput name="notes" placeholder="Purchase / damage / correction" />
              </Field>
              <SubmitButton><PackagePlus className="h-4 w-4" />Save stock movement</SubmitButton>
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

        <AdminCard title="Add Item" description="Create inventory items with purchase price now; selling prices can be added later.">
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
                <TextInput name="sellingPrice" type="number" min="0" step="0.01" defaultValue="0" required />
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

        <AdminCard title="Inventory Items" eyebrow={`${filteredItems.length} shown`}>
          <nav className="mb-4 flex gap-2 overflow-x-auto rounded-2xl border border-[var(--color-border)] bg-stone-50 p-2">
            <a
              className={
                selectedCategoryId === "all"
                  ? "shrink-0 rounded-full bg-stone-950 px-3 py-2 text-xs font-black text-white"
                  : "shrink-0 rounded-full bg-white px-3 py-2 text-xs font-black text-stone-700 shadow-sm hover:bg-amber-50"
              }
              href="/admin/products"
            >
              All ({items.length})
            </a>
            {categories.map((category) => {
              const count = items.filter((item) => item.categoryId === category.id).length;
              return (
                <a
                  className={
                    selectedCategoryId === category.id
                      ? "shrink-0 rounded-full bg-stone-950 px-3 py-2 text-xs font-black text-white"
                      : "shrink-0 rounded-full bg-white px-3 py-2 text-xs font-black text-stone-700 shadow-sm hover:bg-amber-50"
                  }
                  href={`/admin/products?category=${category.id}`}
                  key={category.id}
                >
                  {category.name} ({count})
                </a>
              );
            })}
          </nav>
          <div className="desktop-table-only">
          <TableShell>
            <table className="premium-table min-w-[1180px] text-left align-top">
              <thead>
                <tr>
                  <th className="min-w-[260px]">Item / Edit</th>
                  <th>Category</th>
                  <th className="currency-cell">Buy</th>
                  <th className="currency-cell">Sell</th>
                  <th className="min-w-[220px]">Stock in/out</th>
                  <th>Flags</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <details>
                        <summary className="cursor-pointer font-black text-stone-950 hover:text-[var(--color-gold-dark)]">
                          {item.name}
                        </summary>
                        <form action={updateItem} className="mt-3 grid gap-2 rounded-xl bg-stone-50 p-3">
                          <input name="itemId" type="hidden" value={item.id} />
                          <div className="grid gap-2 sm:grid-cols-2">
                            <Field label="Name">
                              <TextInput name="name" defaultValue={item.name} required />
                            </Field>
                            <Field label="SKU">
                              <TextInput name="sku" defaultValue={item.sku ?? ""} />
                            </Field>
                            <Field label="Category">
                              <SelectInput name="categoryId" defaultValue={item.categoryId} required>
                                {categories.map((category) => (
                                  <option key={category.id} value={category.id}>{category.name}</option>
                                ))}
                              </SelectInput>
                            </Field>
                            <Field label="Unit">
                              <TextInput name="unitType" defaultValue={item.unitType} required />
                            </Field>
                            <Field label="Buying price">
                              <TextInput name="purchaseCost" type="number" min="0" step="0.01" defaultValue={item.purchaseCostCents / 100} required />
                            </Field>
                            <Field label="Selling price">
                              <TextInput name="sellingPrice" type="number" min="0" step="0.01" defaultValue={item.sellingPriceCents / 100} required />
                            </Field>
                            <Field label="Tax %">
                              <TextInput name="taxPercent" type="number" min="0" step="0.01" defaultValue={item.taxPercent} />
                            </Field>
                          </div>
                          <div className="grid gap-2 sm:grid-cols-4">
                            <Checkbox name="commissionEligible" label="Commission" defaultChecked={item.commissionEligible} />
                            <Checkbox name="specialCommissionEligible" label="Special" defaultChecked={item.specialCommissionEligible} />
                            <Checkbox name="complimentaryEligible" label="Free starter" defaultChecked={item.complimentaryEligible} />
                            <Checkbox name="active" label="Active" defaultChecked={item.active} />
                          </div>
                          <SubmitButton>Save item</SubmitButton>
                        </form>
                      </details>
                      <p className="mt-1 text-xs text-stone-500">{item.sku ?? "No SKU"}</p>
                    </td>
                    <td>{item.category.name}<br /><span className="text-xs text-stone-500">{item.unitType}</span></td>
                    <td className="currency-cell">{formatCurrency(item.purchaseCostCents)}</td>
                    <td className="currency-cell">{formatCurrency(item.sellingPriceCents)}</td>
                    <td>
                      <p className="mb-2 text-sm font-black">{item.stockQuantity} {item.unitType}</p>
                      <form action={adjustInventoryStock} className="grid gap-2 rounded-xl bg-stone-50 p-2">
                        <input name="itemId" type="hidden" value={item.id} />
                        <div className="grid grid-cols-2 gap-2">
                          <SelectInput name="direction" required>
                            <option value="IN">Stock in</option>
                            <option value="OUT">Stock out</option>
                          </SelectInput>
                          <TextInput name="quantity" type="number" min="0.01" step="0.01" placeholder="Qty" required />
                          <TextInput name="unitCost" type="number" min="0" step="0.01" defaultValue={item.purchaseCostCents / 100} required />
                          <TextInput name="notes" placeholder="Reason" />
                        </div>
                        <SubmitButton>Update stock</SubmitButton>
                      </form>
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-1">
                        {item.commissionEligible ? <StatusBadge tone="gold">commission</StatusBadge> : null}
                        {item.specialCommissionEligible ? <StatusBadge tone="warning">special</StatusBadge> : null}
                        {item.complimentaryEligible ? <StatusBadge tone="success">complimentary</StatusBadge> : null}
                      </div>
                    </td>
                    <td><StatusBadge tone={item.active ? "success" : "danger"}>{item.active ? "active" : "inactive"}</StatusBadge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableShell>
          </div>
          <div className="mobile-card-list">
            {filteredItems.map((item) => (
              <article className="rounded-2xl border border-[var(--color-border)] bg-white p-3 shadow-sm" key={item.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-black">{item.name}</p>
                    <p className="text-xs text-stone-500">{item.category.name} · {item.stockQuantity} {item.unitType}</p>
                  </div>
                  <div className="text-right text-xs font-black">
                    <p>Buy {formatCurrency(item.purchaseCostCents)}</p>
                    <p>Sell {formatCurrency(item.sellingPriceCents)}</p>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {item.commissionEligible ? <StatusBadge tone="gold">commission</StatusBadge> : null}
                  {item.specialCommissionEligible ? <StatusBadge tone="warning">special</StatusBadge> : null}
                  {item.complimentaryEligible ? <StatusBadge tone="success">complimentary</StatusBadge> : null}
                  <StatusBadge tone={item.active ? "success" : "danger"}>{item.active ? "active" : "inactive"}</StatusBadge>
                </div>
                <details className="mt-3">
                  <summary className="cursor-pointer rounded-lg bg-stone-100 px-3 py-2 text-sm font-black">Edit item / stock</summary>
                  <form action={updateItem} className="mt-3 grid gap-2 rounded-xl bg-stone-50 p-3">
                    <input name="itemId" type="hidden" value={item.id} />
                    <Field label="Name"><TextInput name="name" defaultValue={item.name} required /></Field>
                    <Field label="SKU"><TextInput name="sku" defaultValue={item.sku ?? ""} /></Field>
                    <Field label="Category">
                      <SelectInput name="categoryId" defaultValue={item.categoryId} required>
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>{category.name}</option>
                        ))}
                      </SelectInput>
                    </Field>
                    <div className="grid grid-cols-2 gap-2">
                      <Field label="Unit"><TextInput name="unitType" defaultValue={item.unitType} required /></Field>
                      <Field label="Tax %"><TextInput name="taxPercent" type="number" min="0" step="0.01" defaultValue={item.taxPercent} /></Field>
                      <Field label="Buying"><TextInput name="purchaseCost" type="number" min="0" step="0.01" defaultValue={item.purchaseCostCents / 100} required /></Field>
                      <Field label="Selling"><TextInput name="sellingPrice" type="number" min="0" step="0.01" defaultValue={item.sellingPriceCents / 100} required /></Field>
                    </div>
                    <div className="grid gap-2">
                      <Checkbox name="commissionEligible" label="Commission" defaultChecked={item.commissionEligible} />
                      <Checkbox name="specialCommissionEligible" label="Special drink" defaultChecked={item.specialCommissionEligible} />
                      <Checkbox name="complimentaryEligible" label="Free starter" defaultChecked={item.complimentaryEligible} />
                      <Checkbox name="active" label="Active" defaultChecked={item.active} />
                    </div>
                    <SubmitButton>Save item</SubmitButton>
                  </form>
                  <form action={adjustInventoryStock} className="mt-3 grid gap-2 rounded-xl bg-stone-50 p-3">
                    <input name="itemId" type="hidden" value={item.id} />
                    <div className="grid grid-cols-2 gap-2">
                      <Field label="Action">
                        <SelectInput name="direction" required>
                          <option value="IN">Stock in</option>
                          <option value="OUT">Stock out</option>
                        </SelectInput>
                      </Field>
                      <Field label="Qty"><TextInput name="quantity" type="number" min="0.01" step="0.01" required /></Field>
                      <Field label="Cost"><TextInput name="unitCost" type="number" min="0" step="0.01" defaultValue={item.purchaseCostCents / 100} required /></Field>
                      <Field label="Reason"><TextInput name="notes" /></Field>
                    </div>
                    <SubmitButton>Update stock</SubmitButton>
                  </form>
                </details>
              </article>
            ))}
          </div>
        </AdminCard>
      </div>
    </div>
  );
}
