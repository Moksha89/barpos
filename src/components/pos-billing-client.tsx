"use client";

import { PaymentMode } from "@prisma/client";
import { useMemo, useRef, useState } from "react";
import { Plus, ReceiptText, Trash2 } from "lucide-react";

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
  paymentMethodId: string;
  amount: number;
};

type PosPaymentMethod = {
  id: string;
  name: string;
  mode: PaymentMode;
};

type ExistingOrderItem = {
  itemId: string;
  quantity: number;
  isComplimentary: boolean;
  offerId: string | null;
  complimentaryReason: string | null;
  item: PosItem;
};

export function PosBillingClient({
  categories,
  items,
  staff,
  offers,
  paymentMethods,
  table,
}: {
  categories: PosCategory[];
  items: PosItem[];
  staff: PosStaff[];
  offers: PosOffer[];
  paymentMethods: PosPaymentMethod[];
  table?: {
    id: string;
    tableName: string;
    customerName: string | null;
    staffId: string;
    orders: {
      id: string;
      status: string;
      discountCents: number;
      items: ExistingOrderItem[];
    }[];
  } | null;
}) {
  const existingOrder = table?.orders[0];
  const defaultMethod = paymentMethods[0];
  const [selectedCategoryId, setSelectedCategoryId] = useState(categories[0]?.id);
  const [cart, setCart] = useState<CartLine[]>(
    existingOrder?.items.map((line, index) => ({
      key: `saved-${line.itemId}-${index}`,
      item: line.item,
      quantity: line.quantity,
      isComplimentary: line.isComplimentary,
      offerId: line.offerId ?? undefined,
      complimentaryReason: line.complimentaryReason ?? undefined,
    })) ?? [],
  );
  const [staffId, setStaffId] = useState(table?.staffId ?? staff[0]?.id ?? "");
  const [tableNumber, setTableNumber] = useState(table?.tableName ?? "");
  const [customerName, setCustomerName] = useState(table?.customerName ?? "");
  const [discount, setDiscount] = useState(fromCents(existingOrder?.discountCents ?? 0));
  const [tip, setTip] = useState(0);
  const [payments, setPayments] = useState<PaymentLine[]>([
    {
      mode: defaultMethod?.mode ?? PaymentMode.CASH,
      paymentMethodId: defaultMethod?.id ?? "",
      amount: 0,
    },
  ]);
  const keyCounter = useRef(0);
  const orderJsonRef = useRef<HTMLInputElement>(null);
  const orderActionRef = useRef<HTMLInputElement>(null);

  const selectedStaff = staff.find((member) => member.id === staffId);
  const visibleItems = items.filter((item) => item.categoryId === selectedCategoryId);

  const nextCartKey = () => {
    keyCounter.current += 1;
    return `cart-${keyCounter.current}`;
  };

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
          key: nextCartKey(),
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
        key: nextCartKey(),
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
    if (!orderJsonRef.current) {
      return;
    }
    const selectedAction = orderActionRef.current?.value ?? "SAVE";
    const isSettlement = selectedAction === "SETTLE";
    orderJsonRef.current.value =
      JSON.stringify({
        tableId: table?.id ?? null,
        action: selectedAction,
        tableNumber,
        customerName,
        staffId,
        discount,
        tip: isSettlement ? tip : 0,
        items: cart.map((line) => ({
          itemId: line.item.id,
          quantity: line.quantity,
          isComplimentary: line.isComplimentary,
          offerId: line.offerId ?? null,
          complimentaryReason: line.complimentaryReason ?? null,
        })),
        payments: isSettlement ? payments : [],
      });
  };

  const setExactCash = () => {
    setPayments([
      {
        mode: defaultMethod?.mode ?? PaymentMode.CASH,
        paymentMethodId: defaultMethod?.id ?? "",
        amount: totalDue,
      },
    ]);
  };

  return (
    <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_380px]">
      <section className="rounded-2xl border border-[var(--color-border)] bg-white p-3 shadow-sm sm:p-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="grid gap-1.5 text-xs font-black uppercase tracking-wide text-stone-700">
            Table / Customer
            <input
              className="min-h-10 rounded-lg border border-[var(--color-border)] px-3 text-sm outline-none focus:border-[var(--color-gold)] focus:ring-2 focus:ring-[var(--color-gold)] disabled:bg-stone-100"
              onChange={(event) => setTableNumber(event.target.value)}
              placeholder="T-12"
              readOnly={Boolean(table)}
              value={tableNumber}
            />
          </label>
          <label className="grid gap-1.5 text-xs font-black uppercase tracking-wide text-stone-700">
            Customer name
            <input
              className="min-h-10 rounded-lg border border-[var(--color-border)] px-3 text-sm outline-none focus:border-[var(--color-gold)] focus:ring-2 focus:ring-[var(--color-gold)] disabled:bg-stone-100"
              onChange={(event) => setCustomerName(event.target.value)}
              placeholder="Walk-in"
              readOnly={Boolean(table)}
              value={customerName}
            />
          </label>
          <label className="grid gap-1.5 text-xs font-black uppercase tracking-wide text-stone-700">
            Waitress / Staff
            <select
              className="min-h-10 rounded-lg border border-[var(--color-border)] px-3 text-sm outline-none focus:border-[var(--color-gold)] focus:ring-2 focus:ring-[var(--color-gold)] disabled:bg-stone-100"
              disabled={Boolean(table)}
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

        <div className="mt-4 flex gap-2 overflow-x-auto rounded-2xl bg-stone-50 p-2">
          {categories.map((category) => (
            <button
              className={`min-h-9 shrink-0 rounded-xl px-3 text-xs font-black transition ${
                category.id === selectedCategoryId
                  ? "bg-stone-950 text-white shadow-sm"
                  : "bg-white text-stone-700 hover:bg-amber-50"
              }`}
              key={category.id}
              onClick={() => setSelectedCategoryId(category.id)}
              type="button"
            >
              {category.name}
            </button>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {visibleItems.map((item) => (
            <button
              className="group min-h-24 rounded-2xl border border-[var(--color-border)] bg-stone-50 p-3 text-left transition hover:-translate-y-0.5 hover:border-[var(--color-gold)] hover:bg-amber-50 hover:shadow-sm"
              key={item.id}
              onClick={() => addItem(item)}
              type="button"
            >
              <div className="flex h-full flex-col justify-between gap-3">
                <div>
                  <p className="line-clamp-2 text-sm font-black text-stone-950">{item.name}</p>
                  <p className="mt-1 text-lg font-black text-[var(--color-gold-dark)]">
                    {formatCurrency(item.sellingPriceCents)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1">
                  <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-black text-stone-500">Stock {item.stockQuantity}</span>
                  {item.specialCommissionEligible ? <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black text-amber-800">Special</span> : null}
                  {item.complimentaryEligible ? <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-black text-green-700">Free eligible</span> : null}
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-3">
          <h2 className="text-sm font-black">Eligible complimentary starters</h2>
          {eligibleOffers.length === 0 ? (
            <p className="mt-1 text-sm text-stone-600">
              Add eligible alcohol items to unlock configured offers.
            </p>
          ) : (
            <div className="mt-3 grid gap-2.5">
              {eligibleOffers.map(({ offer, remaining }) => (
                <div key={offer.id} className="rounded-2xl border border-amber-100 bg-white p-3">
                  <p className="text-sm font-black">
                    {offer.name} · {remaining} free item(s) remaining
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {offer.eligibleFreeItems.map(({ item }) => (
                      <button
                        className="inline-flex items-center gap-1 rounded-full bg-stone-950 px-3 py-2 text-xs font-bold text-white"
                        key={item.id}
                        onClick={() => addComplimentary(offer, item)}
                        type="button"
                      >
                        <Plus className="h-3 w-3" /> Add {item.name} AED 0
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <aside className="sticky bottom-0 rounded-2xl bg-stone-950 p-3 text-white shadow-sm sm:p-4 lg:top-20 lg:self-start">
        <div className="flex items-start justify-between gap-2.5">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-black"><ReceiptText className="h-5 w-5 text-[var(--color-gold)]" />Table bill</h2>
            <p className="mt-1 text-sm text-stone-400">
              {selectedStaff?.name ?? "Select staff"} · {existingOrder ? "saved table open" : "new table order"}
            </p>
          </div>
          <span className="rounded-full bg-[var(--color-gold)] px-3 py-1.5 text-xs font-black text-stone-950">
            {formatCurrency(Math.round(totalDue * 100))}
          </span>
        </div>

        <div className="mt-3 grid max-h-[260px] gap-2 overflow-y-auto pr-1">
          {cart.map((line) => (
            <div key={line.key} className={`rounded-xl p-2.5 ${line.isComplimentary ? "border border-amber-300/40 bg-amber-300/10" : "bg-white/10"}`}>
              <div className="flex items-start justify-between gap-2.5">
                <div>
                  <p className="text-sm font-bold">{line.item.name}</p>
                  <p className="text-xs text-stone-400">
                    Qty {line.quantity} ·{" "}
                    {line.isComplimentary
                      ? "AED 0 Complimentary"
                      : formatCurrency(line.item.sellingPriceCents)}
                  </p>
                </div>
                <button
                  className="grid h-8 w-8 place-items-center rounded-full bg-red-500 text-white transition hover:bg-red-600"
                  onClick={() => removeLine(line.key)}
                  type="button"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3 grid gap-2.5">
          <label className="grid gap-1 text-xs font-black uppercase tracking-wide text-stone-300">
            Discount
            <input
              className="min-h-10 rounded-lg border border-white/10 bg-white/10 px-3 text-sm text-white outline-none focus:border-[var(--color-gold)]"
              min="0"
              onChange={(event) => setDiscount(Number(event.target.value))}
              type="number"
              value={discount}
            />
          </label>
          <label className="grid gap-1 text-xs font-black uppercase tracking-wide text-stone-300">
            Tip (100% waitress)
            <input
              className="min-h-10 rounded-lg border border-white/10 bg-white/10 px-3 text-sm text-white outline-none focus:border-[var(--color-gold)]"
              min="0"
              onChange={(event) => setTip(Number(event.target.value))}
              type="number"
              value={tip}
            />
          </label>
        </div>

        <div className="mt-3 rounded-2xl bg-white/10 p-4 text-sm">
          <div className="flex justify-between"><span>Subtotal</span><b>AED {subtotal.toFixed(0)}</b></div>
          <div className="flex justify-between"><span>Discount</span><b>AED {discount.toFixed(0)}</b></div>
          <div className="flex justify-between"><span>Restaurant sale</span><b>AED {netSales.toFixed(0)}</b></div>
          <div className="flex justify-between text-amber-200"><span>Waitress tip</span><b>AED {tip.toFixed(0)}</b></div>
          <div className="mt-2 flex justify-between border-t border-white/10 pt-2 text-lg font-black">
            <span>Total collected</span><b>AED {totalDue.toFixed(0)}</b>
          </div>
        </div>

        <div className="mt-3 grid gap-2">
          {payments.map((payment, index) => (
            <div className="grid grid-cols-[minmax(0,1fr)_96px_auto] gap-2" key={`${payment.mode}-${index}`}>
              <select
                className="min-h-10 rounded-lg bg-white px-2 text-sm text-stone-950"
                onChange={(event) =>
                  setPayments((current) =>
                    current.map((entry, entryIndex) => {
                      const method = paymentMethods.find(
                        (candidate) => candidate.id === event.target.value,
                      );
                      return entryIndex === index
                        ? {
                            ...entry,
                            paymentMethodId: method?.id ?? "",
                            mode: method?.mode ?? PaymentMode.CASH,
                          }
                        : entry;
                    }),
                  )
                }
                value={payment.paymentMethodId}
              >
                {paymentMethods.map((method) => (
                  <option key={method.id} value={method.id}>{method.name}</option>
                ))}
              </select>
              <input
                className="min-h-10 rounded-lg bg-white px-2 text-sm text-stone-950"
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
                className="rounded-lg bg-white/10 px-3 text-xs font-bold transition hover:bg-red-500"
                onClick={() => setPayments((current) => current.filter((_, entryIndex) => entryIndex !== index))}
                type="button"
              >
                ×
              </button>
            </div>
          ))}
          <div className="grid grid-cols-2 gap-2">
            <button
              className="min-h-10 rounded-lg bg-white/10 text-xs font-bold transition hover:bg-white/15"
              onClick={() =>
                setPayments((current) => [
                  ...current,
                  {
                    mode: defaultMethod?.mode ?? PaymentMode.CARD,
                    paymentMethodId: defaultMethod?.id ?? "",
                    amount: 0,
                  },
                ])
              }
              type="button"
            >
              Add split
            </button>
            <button className="min-h-10 rounded-lg bg-[var(--color-gold)] text-xs font-black text-stone-950 transition hover:bg-[var(--color-gold-dark)]" onClick={setExactCash} type="button">
              Exact cash
            </button>
          </div>
          <p className={paid === totalDue ? "rounded-lg bg-green-500/10 px-3 py-2 text-xs font-bold text-green-300" : "rounded-lg bg-red-500/10 px-3 py-2 text-xs font-bold text-red-300"}>
            Paid AED {paid.toFixed(0)} / Due AED {totalDue.toFixed(0)}
          </p>
        </div>

        <form action={createPosOrder} className="mt-3 grid gap-2" onSubmit={prepareOrder}>
          <input name="orderJson" ref={orderJsonRef} type="hidden" />
          <input ref={orderActionRef} type="hidden" defaultValue="SAVE" />
          <button
            className="min-h-10 w-full rounded-lg bg-white px-4 text-sm font-black text-stone-950 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={cart.length === 0 || !staffId}
            onClick={() => {
              if (orderActionRef.current) orderActionRef.current.value = "SAVE";
            }}
            type="submit"
          >
            Save to active table
          </button>
          <button
            className="min-h-10 w-full rounded-lg bg-[var(--color-gold)] px-4 text-sm font-black text-stone-950 transition hover:bg-[var(--color-gold-dark)] disabled:cursor-not-allowed disabled:opacity-50"
            disabled={cart.length === 0 || !staffId || paid !== totalDue}
            onClick={() => {
              if (orderActionRef.current) orderActionRef.current.value = "SETTLE";
            }}
            type="submit"
          >
            Settle and print invoice
          </button>
          <button
            className="min-h-10 w-full rounded-lg border border-amber-400 px-4 text-sm font-black text-amber-200 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={cart.length === 0 || !staffId}
            onClick={() => {
              if (orderActionRef.current) orderActionRef.current.value = "PENDING";
            }}
            type="submit"
          >
            Mark pending bill
          </button>
        </form>
      </aside>
    </div>
  );
}
