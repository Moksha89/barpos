import { AdminCard } from "@/components/admin-card";
import {
  Checkbox,
  Field,
  SelectInput,
  SubmitButton,
  TextInput,
} from "@/components/form-controls";
import { createOffer } from "@/lib/actions";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function OffersPage() {
  await requirePermission("offers.manage");
  const [offers, categories, items] = await Promise.all([
    prisma.offer.findMany({
      include: {
        buyCategory: true,
        buyItem: true,
        freeCategory: true,
        eligibleFreeItems: { include: { item: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
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
          <h1 className="mt-2 text-3xl font-black">Offer Rules</h1>
          <p className="mt-2 text-stone-600">
            Configure buy rules, free item/category, eligible starter lists,
            date range, approval needs, and waiter choice behavior.
          </p>
        </header>

        <AdminCard title="Create Offer" description="Leave buy item empty to use buy category matching.">
          <form action={createOffer} className="grid gap-3">
            <div className="grid gap-3 md:grid-cols-3">
              <Field label="Offer name">
                <TextInput name="name" placeholder="Full Bottle = 2 Free Starters" required />
              </Field>
              <Field label="Buy item">
                <SelectInput name="buyItemId">
                  <option value="">Any item in category</option>
                  {items.map((item) => (
                    <option key={item.id} value={item.id}>{item.name}</option>
                  ))}
                </SelectInput>
              </Field>
              <Field label="Buy category">
                <SelectInput name="buyCategoryId">
                  <option value="">Select category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </SelectInput>
              </Field>
              <Field label="Buy quantity">
                <TextInput name="buyQuantity" type="number" min="1" defaultValue="1" required />
              </Field>
              <Field label="Free category">
                <SelectInput name="freeCategoryId">
                  <option value="">Select category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </SelectInput>
              </Field>
              <Field label="Free quantity">
                <TextInput name="freeQuantity" type="number" min="1" defaultValue="1" required />
              </Field>
              <Field label="Start date">
                <TextInput name="startDate" type="date" />
              </Field>
              <Field label="End date">
                <TextInput name="endDate" type="date" />
              </Field>
            </div>
            <fieldset className="rounded-2xl border border-stone-200 p-3">
              <legend className="px-2 text-sm font-bold text-stone-700">
                Eligible free items
              </legend>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {items
                  .filter((item) => item.complimentaryEligible)
                  .map((item) => (
                    <label key={item.id} className="flex gap-2 text-sm font-medium">
                      <input name="eligibleFreeItemIds" type="checkbox" value={item.id} />
                      {item.name}
                    </label>
                  ))}
              </div>
            </fieldset>
            <div className="grid gap-2 sm:grid-cols-3">
              <Checkbox name="active" label="Active" />
              <Checkbox name="managerApprovalRequired" label="Manager approval" defaultChecked={false} />
              <Checkbox name="waiterCanChooseFreeItem" label="Waiter can choose" />
            </div>
            <SubmitButton>Create offer</SubmitButton>
          </form>
        </AdminCard>

        <AdminCard title="Configured Offers" eyebrow={`${offers.length} rules`}>
          <div className="grid gap-3">
            {offers.map((offer) => (
              <article key={offer.id} className="rounded-2xl border border-stone-200 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <h2 className="text-lg font-black">{offer.name}</h2>
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
                    {offer.active ? "Active" : "Inactive"}
                  </span>
                </div>
                <p className="mt-2 text-sm text-stone-600">
                  Buy {offer.buyQuantity} × {offer.buyItem?.name ?? offer.buyCategory?.name ?? "configured item"} → {offer.freeQuantity} free {offer.freeCategory?.name ?? "item"}
                </p>
                <p className="mt-2 text-xs text-stone-500">
                  Eligible: {offer.eligibleFreeItems.map((entry) => entry.item.name).join(", ") || "category default"}
                </p>
              </article>
            ))}
          </div>
        </AdminCard>
      </div>
    </div>
  );
}
