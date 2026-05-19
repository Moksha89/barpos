import { loginAction } from "@/lib/actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="grid min-h-screen bg-stone-950 text-white lg:grid-cols-[1fr_520px]">
      <section className="hidden items-center bg-[radial-gradient(circle_at_top_left,#fbbf24,transparent_30%),#0c0a09] p-10 lg:flex">
        <div className="max-w-xl">
          <p className="text-sm font-bold uppercase tracking-[0.35em] text-amber-300">
            BarPOS Dubai
          </p>
          <h1 className="mt-4 text-5xl font-black leading-tight">
            Secure role-based POS for Admin and Billman.
          </h1>
          <p className="mt-5 text-lg leading-8 text-stone-300">
            Login protects every app page, shows only allowed modules, and keeps
            billing fast on mobile, tablet, and desktop.
          </p>
        </div>
      </section>
      <section className="flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 text-stone-950 shadow-2xl">
        <p className="text-sm font-bold uppercase tracking-[0.25em] text-amber-700">
          BarPOS Login
        </p>
        <h1 className="mt-2 text-3xl font-black">Sign in to continue</h1>
        <div className="mt-3 grid gap-2 rounded-2xl bg-stone-50 p-3 text-sm text-stone-600">
          <p><b>Admin:</b> admin / admin123</p>
          <p><b>Billman:</b> billman / billman123</p>
        </div>
        {params.error ? (
          <div className="mt-4 rounded-2xl bg-red-50 p-3 text-sm font-bold text-red-700">
            Invalid email or password.
          </div>
        ) : null}
        <form action={loginAction} className="mt-5 grid gap-3">
          <label className="grid gap-2 text-sm font-bold">
            Username
            <input
              className="min-h-12 rounded-xl border border-stone-200 px-3"
              defaultValue="admin"
              name="username"
              type="text"
              required
            />
          </label>
          <label className="grid gap-2 text-sm font-bold">
            Password
            <input
              className="min-h-12 rounded-xl border border-stone-200 px-3"
              defaultValue="admin123"
              name="password"
              type="password"
              required
            />
          </label>
          <button
            className="min-h-12 rounded-xl bg-amber-400 px-4 font-black text-stone-950"
            type="submit"
          >
            Sign in
          </button>
        </form>
      </div>
      </section>
    </main>
  );
}
