"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { clsx } from "clsx";

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
        "flex h-full flex-col bg-stone-950 text-white transition-all",
        collapsed ? "lg:w-20" : "lg:w-72",
      )}
    >
      <div className="flex min-h-16 items-center gap-3 border-b border-white/10 px-4">
        <Link className="flex items-center gap-3" href="/">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-amber-400 text-stone-950">
            <StoreIcon className="h-5 w-5" />
          </span>
          {!collapsed ? (
            <span>
              <span className="block text-sm font-black leading-tight">BarPOS</span>
              <span className="block text-xs font-semibold text-amber-200">Dubai AED</span>
            </span>
          ) : null}
        </Link>
      </div>

      <nav className="grid flex-1 content-start gap-1 overflow-y-auto p-3">
        {allowedItems.map((item) => {
          const Icon = item.icon;
          const itemPath = item.href.split("#")[0];
          const active =
            itemPath === "/" ? pathname === "/" : pathname.startsWith(itemPath);
          return (
            <Link
              className={clsx(
                "flex min-h-12 items-center gap-3 rounded-2xl px-3 text-sm font-bold transition",
                active
                  ? "bg-amber-400 text-stone-950"
                  : "text-stone-200 hover:bg-white/10 hover:text-white",
              )}
              href={item.href}
              key={item.href + item.label}
              onClick={() => setMobileOpen(false)}
              title={item.label}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed ? <span>{item.label}</span> : null}
            </Link>
          );
        })}
      </nav>

      <button
        className="m-3 hidden min-h-11 rounded-2xl border border-white/10 text-xs font-bold text-stone-300 lg:block"
        onClick={() => setCollapsed((value) => !value)}
        type="button"
      >
        {collapsed ? "Expand" : "Collapse"}
      </button>
    </aside>
  );

  return (
    <div className="min-h-screen bg-stone-100 text-stone-950 lg:flex">
      <div className="hidden lg:sticky lg:top-0 lg:block lg:h-screen">{sidebar}</div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Close menu"
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
            type="button"
          />
          <div className="relative h-full w-80 max-w-[86vw]">{sidebar}</div>
        </div>
      ) : null}

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-40 flex min-h-16 items-center justify-between border-b border-stone-200 bg-white/95 px-3 backdrop-blur sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <button
              aria-label="Open menu"
              className="grid h-11 w-11 place-items-center rounded-2xl bg-stone-950 text-white lg:hidden"
              onClick={() => setMobileOpen(true)}
              type="button"
            >
              <MenuIcon className="h-5 w-5" />
            </button>
            <Link className="flex min-w-0 items-center gap-3" href="/">
              <span className="hidden h-10 w-10 shrink-0 place-items-center rounded-2xl bg-stone-950 text-amber-300 sm:grid">
                <StoreIcon className="h-5 w-5" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-base font-black">BarPOS Restaurant</span>
                <span className="block truncate text-xs font-semibold text-stone-500">
                  {dashboardLabel} dashboard
                </span>
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <button
              aria-label="Notifications"
              className="grid h-10 w-10 place-items-center rounded-2xl border border-stone-200 bg-white"
              type="button"
            >
              <BellIcon className="h-5 w-5" />
            </button>
            <div className="hidden items-center gap-3 rounded-2xl border border-stone-200 bg-stone-50 px-3 py-2 sm:flex">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-amber-400 text-sm font-black">
                {user.name.slice(0, 1).toUpperCase()}
              </span>
              <span className="text-sm">
                <span className="block font-black">{user.name}</span>
                <span className="block text-xs font-semibold text-stone-500">{user.role.label}</span>
              </span>
            </div>
            <form action={logoutAction}>
              <button
                className="grid h-10 w-10 place-items-center rounded-2xl bg-stone-950 text-white"
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
