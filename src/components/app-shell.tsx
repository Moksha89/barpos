"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { clsx } from "clsx";
import { BarChart3, ChevronDown, ShieldCheck } from "lucide-react";

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
  const activeItem = allowedItems.find((item) => {
    const itemPath = item.href.split("#")[0];
    return itemPath === "/" ? pathname === "/" : pathname.startsWith(itemPath);
  });
  const pageLabel = pathname === "/" ? "Dashboard" : activeItem?.label ?? "Dashboard";
  const pageTitle = pathname === "/" ? `${dashboardLabel} dashboard` : pageLabel;

  const sidebar = (
    <aside
      className={clsx(
        "flex h-full flex-col bg-[#050505] text-white transition-all",
        collapsed ? "lg:w-[76px]" : "lg:w-[236px]",
      )}
    >
      <div className="flex min-h-[92px] items-center gap-3 px-5">
        <Link className="flex min-w-0 items-center gap-3" href="/">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-[var(--color-gold)]">
            <BarChart3 className="h-8 w-8" strokeWidth={2.4} />
          </span>
          {!collapsed ? (
            <span className="min-w-0">
              <span className="block truncate text-xl font-black leading-tight">BarPOS</span>
              <span className="block truncate text-sm font-bold text-[var(--color-gold)]">Dubai AED</span>
            </span>
          ) : null}
        </Link>
      </div>

      <nav className="grid flex-1 content-start gap-2 overflow-y-auto px-5 py-2">
        {allowedItems.map((item) => {
          const Icon = item.icon;
          const itemPath = item.href.split("#")[0];
          const active =
            itemPath === "/" ? pathname === "/" : pathname.startsWith(itemPath);
          return (
            <Link
              className={clsx(
                "group flex min-h-11 items-center gap-3 rounded-2xl px-3.5 text-sm font-semibold transition",
                active
                  ? "bg-[var(--color-gold)] text-stone-950 shadow-[0_10px_24px_rgba(245,184,0,0.22)]"
                  : "text-stone-200 hover:bg-white/10 hover:text-white",
                collapsed ? "justify-center px-2" : "",
              )}
              href={item.href}
              key={item.href + item.label}
              onClick={() => setMobileOpen(false)}
              title={item.label}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={2.1} />
              {!collapsed ? <span>{item.label}</span> : null}
            </Link>
          );
        })}
      </nav>

      {!collapsed ? (
        <div className="mx-5 mb-4 rounded-2xl border border-white/15 bg-white/[0.04] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[var(--color-gold)] text-[var(--color-gold)]">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-black">Secure &amp; Compliant</p>
              <p className="mt-1 text-xs leading-5 text-stone-300">Your data is safe and encrypted</p>
            </div>
          </div>
        </div>
      ) : null}

      <button
        className="mx-5 mb-5 hidden min-h-10 rounded-2xl border border-white/15 text-xs font-bold text-stone-300 transition hover:bg-white/10 hover:text-white lg:block"
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
        <header className="sticky top-0 z-40 flex min-h-16 items-center justify-between border-b border-white/10 bg-[#050505] px-3 text-white backdrop-blur lg:border-[var(--color-border)] lg:bg-white/95 lg:px-6 lg:text-stone-950">
          <div className="flex min-w-0 items-center gap-3">
            <button
              aria-label="Open menu"
              className="grid h-10 w-10 place-items-center rounded-xl text-white transition hover:bg-white/10 lg:hidden"
              onClick={() => setMobileOpen(true)}
              type="button"
            >
              <MenuIcon className="h-5 w-5" />
            </button>
            <Link className="flex min-w-0 items-center gap-3" href="/">
              <span className="hidden h-10 w-10 shrink-0 place-items-center rounded-2xl bg-stone-950 text-[var(--color-gold)] shadow-sm lg:grid">
                <StoreIcon className="h-5 w-5" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-black lg:hidden">BarPOS</span>
                <span className="block truncate text-xs font-bold text-[var(--color-gold)] lg:hidden">Dubai AED</span>
                <span className="hidden items-center gap-1 text-[11px] font-black uppercase tracking-wide text-[var(--color-gold-dark)] lg:flex">
                  {pageLabel}
                  <span className="text-stone-300">›</span>
                </span>
                <span className="hidden truncate text-xl font-semibold text-stone-950 lg:block">{pageTitle}</span>
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <button
              aria-label="Notifications"
              className="relative grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/5 transition hover:bg-white/10 lg:border-0 lg:bg-white lg:hover:bg-stone-50"
              type="button"
            >
              <BellIcon className="h-5 w-5" />
              <span className="absolute right-1.5 top-1 grid h-4 w-4 place-items-center rounded-full bg-[var(--color-gold)] text-[10px] font-black text-stone-950">3</span>
            </button>
            <div className="hidden min-h-12 items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-stone-50 px-3 py-1.5 sm:flex">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-[var(--color-gold)] text-sm font-black text-stone-950">
                {user.name.slice(0, 1).toUpperCase()}
              </span>
              <span className="hidden text-xs md:block">
                <span className="block text-sm font-black">{user.name}</span>
                <span className="block text-xs font-semibold text-[var(--color-muted)]">{user.role.label}</span>
              </span>
              <ChevronDown className="hidden h-4 w-4 text-stone-500 md:block" />
            </div>
            <form action={logoutAction}>
              <button
                className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/5 text-white transition hover:bg-white/10 lg:border-[var(--color-border)] lg:bg-stone-50 lg:text-stone-950 lg:hover:bg-stone-100"
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
