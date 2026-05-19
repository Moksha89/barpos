export default function SettingsPage() {
  return (
    <main className="min-h-screen bg-stone-100 p-4 sm:p-6">
      <section className="mx-auto max-w-7xl rounded-3xl bg-white p-6 shadow-sm">
        <p className="text-sm font-bold uppercase tracking-[0.25em] text-amber-700">
          Admin
        </p>
        <h1 className="mt-2 text-3xl font-black">System Settings</h1>
        <p className="mt-3 text-stone-600">
          Phase 2 will configure invoice format, tax, printer settings, payment
          modes, roles, permissions, and business details.
        </p>
      </section>
    </main>
  );
}
