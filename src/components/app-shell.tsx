"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { clsx } from "clsx";
import { Search } from "lucide-react";

import { logoutAction } from "@/lib/actions";
import { adminNavigation, billmanNavigation, headerIcons } from "@/lib/navigation";

type AppShellUser = {
  name: string;
  role: {
    name: string;
    label: string;
  };
  permissions: string[];
};

export function AppShell({
  user,
  children,
}: {
  user: AppShellUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const items = user.role.name === "OWNER_ADMIN" ? adminNavigation : billmanNavigation;
  const allowedItems = items.filter((item) => user.permissions.includes(item.permission));
  const StoreIcon = headerIcons.Store;
  const BellIcon = headerIcons.Bell;
  const MenuIcon = headerIcons.Menu;
  const LogOutIcon = headerIcons.LogOut;
  const dashboardLabel =
    user.role.name === "OWNER_ADMIN" ? "Admin" : user.role.label;

  const sidebar = (
    <aside
      className={clsx(
        "flex h-full flex-col bg-[var(--color-sidebar)] text-white transition-all",
        collapsed ? "lg:w-[72px]" : "lg:w-64",
      )}
    >
      <div className="flex min-h-16 items-center gap-2 border-b border-white/10 px-3">
        <Link className="flex min-w-0 items-center gap-2.5" href="/">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[var(--color-gold)] text-stone-950 shadow-[0_0_24px_rgba(245,184,0,0.25)]">
            <StoreIcon className="h-5 w-5" />
          </span>
          {!collapsed ? (
            <span className="min-w-0">
              <span className="block truncate text-sm font-black leading-tight">BarPOS Dubai</span>
              <span className="block truncate text-[11px] font-bold text-amber-200">Premium AED POS</span>
            </span>
          ) : null}
        </Link>
      </div>

      <nav className="grid flex-1 content-start gap-1.5 overflow-y-auto p-2.5">
        {allowedItems.map((item) => {
          const Icon = item.icon;
          const itemPath = item.href.split("#")[0];
          const active =
            itemPath === "/" ? pathname === "/" : pathname.startsWith(itemPath);
          return (
            <Link
              className={clsx(
                "group flex min-h-10 items-center gap-3 rounded-xl px-3 text-[13px] font-bold transition",
                active
                  ? "bg-[var(--color-gold)] text-stone-950 shadow-sm"
                  : "text-stone-300 hover:bg-white/10 hover:text-white",
                collapsed ? "justify-center px-2" : "",
              )}
              href={item.href}
              key={item.href + item.label}
              onClick={() => setMobileOpen(false)}
              title={item.label}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" />
              {!collapsed ? <span>{item.label}</span> : null}
            </Link>
          );
        })}
      </nav>

      <button
        className="m-2.5 hidden min-h-9 rounded-xl border border-white/10 text-xs font-bold text-stone-300 transition hover:bg-white/10 hover:text-white lg:block"
        onClick={() => setCollapsed((value) => !value)}
        type="button"
      >
        {collapsed ? "Expand" : "Collapse"}
      </button>
    </aside>
  );

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-stone-950 lg:flex">
      <div className="hidden lg:sticky lg:top-0 lg:block lg:h-screen">{sidebar}</div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Close menu"
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
            type="button"
          />
          <div className="relative h-full w-80 max-w-[88vw] shadow-2xl">{sidebar}</div>
        </div>
      ) : null}

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-40 flex min-h-16 items-center justify-between border-b border-[var(--color-border)] bg-white/95 px-3 backdrop-blur sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <button
              aria-label="Open menu"
              className="grid h-10 w-10 place-items-center rounded-xl bg-stone-950 text-white shadow-sm lg:hidden"
              onClick={() => setMobileOpen(true)}
              type="button"
            >
              <MenuIcon className="h-5 w-5" />
            </button>
            <Link className="flex min-w-0 items-center gap-2.5" href="/">
              <span className="hidden h-10 w-10 shrink-0 place-items-center rounded-2xl bg-stone-950 text-[var(--color-gold)] sm:grid">
                <StoreIcon className="h-5 w-5" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-black">BarPOS Dubai</span>
                <span className="block truncate text-xs font-semibold text-[var(--color-muted)]">
                  {dashboardLabel} dashboard
                </span>
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden min-w-[220px] items-center gap-2 rounded-xl border border-[var(--color-border)] bg-stone-50 px-3 py-2 text-sm text-stone-500 xl:flex">
              <Search className="h-4 w-4" />
              <span>Quick search</span>
            </div>
            <button
              aria-label="Notifications"
              className="grid h-10 w-10 place-items-center rounded-xl border border-[var(--color-border)] bg-white transition hover:bg-stone-50"
              type="button"
            >
              <BellIcon className="h-5 w-5" />
            </button>
            <div className="hidden items-center gap-2 rounded-xl border border-[var(--color-border)] bg-stone-50 px-2.5 py-1.5 sm:flex">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-[var(--color-gold)] text-xs font-black text-stone-950">
                {user.name.slice(0, 1).toUpperCase()}
              </span>
              <span className="text-xs">
                <span className="block font-black">{user.name}</span>
                <span className="block text-xs font-semibold text-[var(--color-muted)]">{user.role.label}</span>
              </span>
            </div>
            <form action={logoutAction}>
              <button
                className="grid h-10 w-10 place-items-center rounded-xl bg-stone-950 text-white transition hover:bg-stone-800"
                title="Logout"
                type="submit"
              >
                <LogOutIcon className="h-5 w-5" />
              </button>
            </form>
          </div>
        </header>
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
