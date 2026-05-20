import { loginAction } from "@/lib/actions";
import { Button } from "@/components/ui";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="grid min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(245,184,0,0.28),transparent_32%),linear-gradient(135deg,#0b0b0b,#171717)] text-white lg:grid-cols-[minmax(0,1fr)_480px]">
      <section className="hidden items-center p-10 lg:flex">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[var(--color-gold)] text-lg font-black text-stone-950">
              B
            </span>
            <span>
              <span className="block text-sm font-black">BarPOS Dubai</span>
              <span className="block text-xs font-bold text-amber-200">Premium restaurant POS</span>
            </span>
          </div>
          <h1 className="mt-8 max-w-xl text-4xl font-black leading-tight tracking-tight">
            Fast table billing, clean reports and secure role access.
          </h1>
          <p className="mt-4 max-w-lg text-base leading-7 text-stone-300">
            Built for bar operations: running tables, waitress commission, pending bills,
            expenses, AED reports and 80mm receipts.
          </p>
          <div className="mt-8 grid max-w-xl gap-3 sm:grid-cols-3">
            {["Role access", "AED reports", "80mm print"].map((item) => (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm font-bold text-stone-200" key={item}>
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md rounded-[28px] border border-white/15 bg-white p-5 text-stone-950 shadow-2xl sm:p-6">
        <div className="mb-5 flex items-center gap-3 lg:hidden">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-stone-950 text-[var(--color-gold)] font-black">B</span>
          <div>
            <p className="text-sm font-black">BarPOS Dubai</p>
            <p className="text-xs font-semibold text-stone-500">Premium AED POS</p>
          </div>
        </div>
        <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--color-gold-dark)]">
          Secure Login
        </p>
        <h1 className="mt-2 text-2xl font-black tracking-tight">Sign in to continue</h1>
        <div className="mt-4 grid gap-2 rounded-2xl border border-amber-100 bg-amber-50 p-3 text-xs text-stone-700">
          <p className="font-black text-stone-950">Demo accounts</p>
          <p><b>Admin:</b> admin / admin123</p>
          <p><b>Billman:</b> billman / billman123</p>
        </div>
        {params.error ? (
          <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 p-3 text-sm font-bold text-red-700">
            Invalid email or password.
          </div>
        ) : null}
        <form action={loginAction} className="mt-5 grid gap-4">
          <label className="grid gap-1.5 text-xs font-black uppercase tracking-wide text-stone-700">
            Username
            <input
              className="min-h-11 rounded-xl border border-[var(--color-border)] px-3 text-sm outline-none focus:border-[var(--color-gold)] focus:ring-2 focus:ring-[var(--color-gold)]"
              defaultValue="admin"
              name="username"
              type="text"
              required
            />
          </label>
          <label className="grid gap-1.5 text-xs font-black uppercase tracking-wide text-stone-700">
            Password
            <input
              className="min-h-11 rounded-xl border border-[var(--color-border)] px-3 text-sm outline-none focus:border-[var(--color-gold)] focus:ring-2 focus:ring-[var(--color-gold)]"
              defaultValue="admin123"
              name="password"
              type="password"
              required
            />
          </label>
          <Button className="min-h-11 w-full" size="lg" type="submit">
            Sign in
          </Button>
        </form>
      </div>
      </section>
    </main>
  );
}
