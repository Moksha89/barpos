"use client";

import { PaymentMode } from "@prisma/client";
import { useMemo, useState } from "react";

import { createPosOrder } from "@/lib/actions";
import { formatCurrency, fromCents } from "@/lib/money";

type PosCategory = {
  id: string;
  name: string;
};

type PosItem = {
  id: string;
  name: string;
  categoryId: string;
  sellingPriceCents: number;
  purchaseCostCents: number;
  stockQuantity: number;
  commissionEligible: boolean;
  specialCommissionEligible: boolean;
  complimentaryEligible: boolean;
};

type PosStaff = {
  id: string;
  name: string;
  normalCommissionPercent: number;
  specialCommissionPercent: number;
};

type PosOffer = {
  id: string;
  name: string;
  buyItemId: string | null;
  buyCategoryId: string | null;
  buyQuantity: number;
  freeQuantity: number;
  eligibleFreeItems: { item: PosItem }[];
};

type CartLine = {
  key: string;
  item: PosItem;
  quantity: number;
  isComplimentary: boolean;
  offerId?: string;
  complimentaryReason?: string;
};

type PaymentLine = {
  mode: PaymentMode;
  amount: number;
};

export function PosBillingClient({
  categories,
  items,
  staff,
  offers,
}: {
  categories: PosCategory[];
  items: PosItem[];
  staff: PosStaff[];
  offers: PosOffer[];
}) {
  const [selectedCategoryId, setSelectedCategoryId] = useState(categories[0]?.id);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [staffId, setStaffId] = useState(staff[0]?.id ?? "");
  const [tableNumber, setTableNumber] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [discount, setDiscount] = useState(0);
  const [tip, setTip] = useState(0);
  const [payments, setPayments] = useState<PaymentLine[]>([
    { mode: PaymentMode.CASH, amount: 0 },
  ]);
  const [orderJson, setOrderJson] = useState("");

  const selectedStaff = staff.find((member) => member.id === staffId);
  const visibleItems = items.filter((item) => item.categoryId === selectedCategoryId);

  const subtotal = cart.reduce(
    (total, line) =>
      total + (line.isComplimentary ? 0 : fromCents(line.item.sellingPriceCents) * line.quantity),
    0,
  );
  const netSales = Math.max(subtotal - discount, 0);
  const totalDue = netSales + tip;
  const paid = payments.reduce((total, payment) => total + payment.amount, 0);

  const eligibleOffers = useMemo(() => {
    return offers
      .map((offer) => {
        const boughtQuantity = cart
          .filter(
            (line) =>
              !line.isComplimentary &&
              (line.item.id === offer.buyItemId ||
                line.item.categoryId === offer.buyCategoryId),
          )
          .reduce((total, line) => total + line.quantity, 0);
        const allowed = Math.floor(boughtQuantity / offer.buyQuantity) * offer.freeQuantity;
        const used = cart
          .filter((line) => line.isComplimentary && line.offerId === offer.id)
          .reduce((total, line) => total + line.quantity, 0);
        return { offer, remaining: Math.max(allowed - used, 0) };
      })
      .filter((entry) => entry.remaining > 0);
  }, [cart, offers]);

  const addItem = (item: PosItem) => {
    setCart((current) => {
      const existing = current.find(
        (line) => line.item.id === item.id && !line.isComplimentary,
      );
      if (existing) {
        return current.map((line) =>
          line.key === existing.key ? { ...line, quantity: line.quantity + 1 } : line,
        );
      }
      return [
        ...current,
        {
          key: crypto.randomUUID(),
          item,
          quantity: 1,
          isComplimentary: false,
        },
      ];
    });
  };

  const addComplimentary = (offer: PosOffer, item: PosItem) => {
    setCart((current) => [
      ...current,
      {
        key: crypto.randomUUID(),
        item,
        quantity: 1,
        isComplimentary: true,
        offerId: offer.id,
        complimentaryReason: offer.name,
      },
    ]);
  };

  const removeLine = (key: string) => {
    setCart((current) => current.filter((line) => line.key !== key));
  };

  const prepareOrder = () => {
    setOrderJson(
      JSON.stringify({
        tableNumber,
        customerName,
        staffId,
        discount,
        tip,
        items: cart.map((line) => ({
          itemId: line.item.id,
          quantity: line.quantity,
          isComplimentary: line.isComplimentary,
          offerId: line.offerId ?? null,
          complimentaryReason: line.complimentaryReason ?? null,
        })),
        payments,
      }),
    );
  };

  const setExactCash = () => {
    setPayments([{ mode: PaymentMode.CASH, amount: totalDue }]);
  };

  return (
    <div className="mx-auto grid max-w-7xl gap-4 lg:grid-cols-[1fr_440px]">
      <section className="rounded-3xl bg-white p-5 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="grid gap-1 text-sm font-bold">
            Table / Customer
            <input
              className="min-h-11 rounded-xl border border-stone-200 px-3"
              onChange={(event) => setTableNumber(event.target.value)}
              placeholder="T-12"
              value={tableNumber}
            />
          </label>
          <label className="grid gap-1 text-sm font-bold">
            Customer name
            <input
              className="min-h-11 rounded-xl border border-stone-200 px-3"
              onChange={(event) => setCustomerName(event.target.value)}
              placeholder="Walk-in"
              value={customerName}
            />
          </label>
          <label className="grid gap-1 text-sm font-bold">
            Waitress / Staff
            <select
              className="min-h-11 rounded-xl border border-stone-200 px-3"
              onChange={(event) => setStaffId(event.target.value)}
              value={staffId}
            >
              {staff.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name} · {member.normalCommissionPercent}% / {member.specialCommissionPercent}%
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-5 flex gap-2 overflow-x-auto pb-2">
          {categories.map((category) => (
            <button
              className={`min-h-12 rounded-2xl px-4 text-sm font-black ${
                category.id === selectedCategoryId
                  ? "bg-stone-950 text-white"
                  : "bg-stone-100 text-stone-700"
              }`}
              key={category.id}
              onClick={() => setSelectedCategoryId(category.id)}
              type="button"
            >
              {category.name}
            </button>
          ))}
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {visibleItems.map((item) => (
            <button
              className="min-h-28 rounded-2xl border border-stone-200 bg-stone-50 p-4 text-left transition hover:border-amber-300 hover:bg-amber-50"
              key={item.id}
              onClick={() => addItem(item)}
              type="button"
            >
              <p className="font-black">{item.name}</p>
              <p className="mt-2 text-lg font-black text-amber-700">
                {formatCurrency(item.sellingPriceCents)}
              </p>
              <p className="mt-1 text-xs text-stone-500">
                Stock {item.stockQuantity}
                {item.specialCommissionEligible ? " · special commission" : ""}
              </p>
            </button>
          ))}
        </div>

        <div className="mt-5 rounded-3xl border border-amber-200 bg-amber-50 p-4">
          <h2 className="font-black">Eligible complimentary starters</h2>
          {eligibleOffers.length === 0 ? (
            <p className="mt-2 text-sm text-stone-600">
              Add eligible alcohol items to unlock configured offers.
            </p>
          ) : (
            <div className="mt-3 grid gap-3">
              {eligibleOffers.map(({ offer, remaining }) => (
                <div key={offer.id} className="rounded-2xl bg-white p-3">
                  <p className="text-sm font-black">
                    {offer.name} · {remaining} free item(s) remaining
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {offer.eligibleFreeItems.map(({ item }) => (
                      <button
                        className="rounded-full bg-stone-950 px-3 py-2 text-xs font-bold text-white"
                        key={item.id}
                        onClick={() => addComplimentary(offer, item)}
                        type="button"
                      >
                        Add {item.name} ₹0
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <aside className="rounded-3xl bg-stone-950 p-5 text-white shadow-sm">
        <h2 className="text-2xl font-black">Current bill</h2>
        <p className="mt-1 text-sm text-stone-400">
          Staff: {selectedStaff?.name ?? "Select staff"}
        </p>

        <div className="mt-4 grid max-h-[360px] gap-2 overflow-y-auto pr-1">
          {cart.map((line) => (
            <div key={line.key} className="rounded-2xl bg-white/10 p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold">{line.item.name}</p>
                  <p className="text-xs text-stone-400">
                    Qty {line.quantity} ·{" "}
                    {line.isComplimentary
                      ? "₹0 Complimentary"
                      : formatCurrency(line.item.sellingPriceCents)}
                  </p>
                </div>
                <button
                  className="rounded-full bg-red-500 px-2 py-1 text-xs font-bold"
                  onClick={() => removeLine(line.key)}
                  type="button"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 grid gap-3">
          <label className="grid gap-1 text-sm font-bold">
            Discount
            <input
              className="min-h-11 rounded-xl border border-white/10 bg-white/10 px-3"
              min="0"
              onChange={(event) => setDiscount(Number(event.target.value))}
              type="number"
              value={discount}
            />
          </label>
          <label className="grid gap-1 text-sm font-bold">
            Tip (100% waitress)
            <input
              className="min-h-11 rounded-xl border border-white/10 bg-white/10 px-3"
              min="0"
              onChange={(event) => setTip(Number(event.target.value))}
              type="number"
              value={tip}
            />
          </label>
        </div>

        <div className="mt-4 rounded-2xl bg-white/10 p-4 text-sm">
          <div className="flex justify-between"><span>Subtotal</span><b>₹{subtotal.toFixed(0)}</b></div>
          <div className="flex justify-between"><span>Discount</span><b>₹{discount.toFixed(0)}</b></div>
          <div className="flex justify-between"><span>Restaurant sale</span><b>₹{netSales.toFixed(0)}</b></div>
          <div className="flex justify-between text-amber-200"><span>Waitress tip</span><b>₹{tip.toFixed(0)}</b></div>
          <div className="mt-2 flex justify-between border-t border-white/10 pt-2 text-lg">
            <span>Total collected</span><b>₹{totalDue.toFixed(0)}</b>
          </div>
        </div>

        <div className="mt-4 grid gap-2">
          {payments.map((payment, index) => (
            <div className="grid grid-cols-[1fr_1fr_auto] gap-2" key={`${payment.mode}-${index}`}>
              <select
                className="min-h-10 rounded-xl bg-white px-2 text-sm text-stone-950"
                onChange={(event) =>
                  setPayments((current) =>
                    current.map((entry, entryIndex) =>
                      entryIndex === index
                        ? { ...entry, mode: event.target.value as PaymentMode }
                        : entry,
                    ),
                  )
                }
                value={payment.mode}
              >
                {Object.values(PaymentMode).map((mode) => (
                  <option key={mode} value={mode}>{mode}</option>
                ))}
              </select>
              <input
                className="min-h-10 rounded-xl bg-white px-2 text-sm text-stone-950"
                onChange={(event) =>
                  setPayments((current) =>
                    current.map((entry, entryIndex) =>
                      entryIndex === index
                        ? { ...entry, amount: Number(event.target.value) }
                        : entry,
                    ),
                  )
                }
                type="number"
                value={payment.amount}
              />
              <button
                className="rounded-xl bg-white/10 px-3 text-xs font-bold"
                onClick={() => setPayments((current) => current.filter((_, entryIndex) => entryIndex !== index))}
                type="button"
              >
                ×
              </button>
            </div>
          ))}
          <div className="grid grid-cols-2 gap-2">
            <button className="min-h-10 rounded-xl bg-white/10 text-xs font-bold" onClick={() => setPayments((current) => [...current, { mode: PaymentMode.CARD, amount: 0 }])} type="button">
              Add split
            </button>
            <button className="min-h-10 rounded-xl bg-amber-400 text-xs font-black text-stone-950" onClick={setExactCash} type="button">
              Exact cash
            </button>
          </div>
          <p className={paid === totalDue ? "text-xs text-green-300" : "text-xs text-red-300"}>
            Paid ₹{paid.toFixed(0)} / Due ₹{totalDue.toFixed(0)}
          </p>
        </div>

        <form action={createPosOrder} className="mt-4" onSubmit={prepareOrder}>
          <input name="orderJson" type="hidden" value={orderJson} />
          <button
            className="min-h-12 w-full rounded-2xl bg-amber-400 px-4 text-base font-black text-stone-950 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={cart.length === 0 || !staffId || paid !== totalDue}
            type="submit"
          >
            Settle & Save Bill
          </button>
        </form>
      </aside>
    </div>
  );
}
