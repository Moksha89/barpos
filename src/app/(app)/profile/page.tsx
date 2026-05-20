import { logoutAction } from "@/lib/actions";
import { getPermissionKeys, requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await requireUser();
  const permissions = getPermissionKeys(user);

  return (
    <div className="app-page text-stone-950">
      <section className="mx-auto w-full max-w-2xl rounded-3xl border border-[var(--color-border)] bg-white p-6 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-gold-dark)]">
          Profile
        </p>
        <h1 className="mt-2 text-2xl font-black">{user.name}</h1>
        <p className="mt-2 text-stone-600">{user.email}</p>
        <div className="mt-5 rounded-2xl bg-stone-50 p-4">
          <p className="font-black">{user.role.label}</p>
          <p className="mt-1 text-sm text-stone-600">{permissions.join(" · ")}</p>
        </div>
        <form action={logoutAction} className="mt-5">
          <button className="min-h-12 rounded-lg bg-stone-950 px-6 font-black text-white" type="submit">
            Logout
          </button>
        </form>
      </section>
    </div>
  );
}
