export default function CustomerInvoicePage() {
  return (
    <main className="min-h-screen bg-white p-6 text-stone-950">
      <section className="mx-auto max-w-md rounded-2xl border border-stone-200 p-6">
        <h1 className="text-center text-2xl font-black">
          Customer Invoice Preview
        </h1>
        <p className="mt-3 text-center text-sm text-stone-600">
          Phase 3 will render printable invoice lines with complimentary ₹0
          items, discount, tax, tip, payment mode, and total paid.
        </p>
      </section>
    </main>
  );
}
