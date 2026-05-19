import { loginAction } from "@/lib/actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-950 p-4 text-white">
      <section className="w-full max-w-md rounded-3xl bg-white p-6 text-stone-950 shadow-2xl">
        <p className="text-sm font-bold uppercase tracking-[0.25em] text-amber-700">
          BarPOS Login
        </p>
        <h1 className="mt-2 text-3xl font-black">Admin access</h1>
        <p className="mt-2 text-sm text-stone-600">
          Demo seed login: admin@barpos.local / Admin@12345
        </p>
        {params.error ? (
          <div className="mt-4 rounded-2xl bg-red-50 p-3 text-sm font-bold text-red-700">
            Invalid email or password.
          </div>
        ) : null}
        <form action={loginAction} className="mt-5 grid gap-3">
          <label className="grid gap-2 text-sm font-bold">
            Email
            <input
              className="min-h-12 rounded-xl border border-stone-200 px-3"
              defaultValue="admin@barpos.local"
              name="email"
              type="email"
              required
            />
          </label>
          <label className="grid gap-2 text-sm font-bold">
            Password
            <input
              className="min-h-12 rounded-xl border border-stone-200 px-3"
              defaultValue="Admin@12345"
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
      </section>
    </main>
  );
}
