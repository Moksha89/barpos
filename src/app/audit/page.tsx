export default function AuditPage() {
  return (
    <main className="min-h-screen bg-stone-100 p-4 sm:p-6">
      <section className="mx-auto max-w-7xl rounded-3xl bg-white p-6 shadow-sm">
        <p className="text-sm font-bold uppercase tracking-[0.25em] text-amber-700">
          Audit
        </p>
        <h1 className="mt-2 text-3xl font-black">Sensitive Action Logs</h1>
        <p className="mt-3 text-stone-600">
          Audit logs will record offer edits, commission changes, voids,
          discounts, complimentary additions, expenses, advances, settlements,
          and invoice reprints.
        </p>
      </section>
    </main>
  );
}
