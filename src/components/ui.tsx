import type { ButtonHTMLAttributes, ReactNode } from "react";
import Link from "next/link";
import clsx from "clsx";
import type { LucideIcon } from "lucide-react";

type ButtonVariant = "primary" | "secondary" | "dark" | "danger" | "ghost";
type ButtonSize = "sm" | "md" | "lg" | "icon";

const buttonVariants: Record<ButtonVariant, string> = {
  primary: "border-[var(--color-gold)] bg-[var(--color-gold)] text-stone-950 hover:bg-[var(--color-gold-dark)]",
  secondary: "border-[var(--color-border)] bg-white text-stone-900 hover:border-stone-300 hover:bg-stone-50",
  dark: "border-stone-950 bg-stone-950 text-white hover:bg-stone-800",
  danger: "border-red-600 bg-red-600 text-white hover:bg-red-700",
  ghost: "border-transparent bg-transparent text-stone-700 hover:bg-stone-100",
};

const buttonSizes: Record<ButtonSize, string> = {
  sm: "min-h-8 px-2.5 text-xs",
  md: "min-h-9 px-3 text-sm",
  lg: "min-h-10 px-4 text-sm",
  icon: "h-9 w-9 p-0",
};

export function buttonClassName({
  className,
  size = "md",
  variant = "primary",
}: {
  className?: string;
  size?: ButtonSize;
  variant?: ButtonVariant;
}) {
  return clsx(
    "inline-flex items-center justify-center gap-2 rounded-lg border font-black shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-gold)] disabled:pointer-events-none disabled:opacity-50",
    buttonVariants[variant],
    buttonSizes[size],
    className,
  );
}

export function Button({
  children,
  className,
  size,
  variant,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  size?: ButtonSize;
  variant?: ButtonVariant;
}) {
  return (
    <button className={buttonClassName({ className, size, variant })} {...props}>
      {children}
    </button>
  );
}

export function ButtonLink({
  children,
  className,
  href,
  size,
  variant,
}: {
  children: ReactNode;
  className?: string;
  href: string;
  size?: ButtonSize;
  variant?: ButtonVariant;
}) {
  return (
    <Link className={buttonClassName({ className, size, variant })} href={href}>
      {children}
    </Link>
  );
}

export function PageHeader({
  action,
  eyebrow,
  subtitle,
  title,
}: {
  action?: ReactNode;
  eyebrow?: string;
  subtitle?: string;
  title: string;
}) {
  return (
    <header className="flex flex-col gap-3 rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--color-gold-dark)]">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-1 truncate text-xl font-black tracking-tight text-stone-950 sm:text-2xl">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-1 max-w-3xl text-sm leading-5 text-[var(--color-muted)]">
            {subtitle}
          </p>
        ) : null}
      </div>
      {action ? <div className="flex shrink-0 flex-wrap gap-2">{action}</div> : null}
    </header>
  );
}

export function StatCard({
  accent = "gold",
  helper,
  icon: Icon,
  label,
  value,
}: {
  accent?: "gold" | "green" | "red" | "dark";
  helper?: string;
  icon?: LucideIcon;
  label: string;
  value: ReactNode;
}) {
  const accents = {
    dark: "bg-stone-950 text-white",
    gold: "bg-amber-50 text-[var(--color-gold-dark)]",
    green: "bg-green-50 text-green-700",
    red: "bg-red-50 text-red-700",
  };

  return (
    <article className="rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-muted)]">
            {label}
          </p>
          <p className="mt-1 truncate text-xl font-black text-stone-950 sm:text-2xl">
            {value}
          </p>
        </div>
        {Icon ? (
          <span className={clsx("grid h-10 w-10 shrink-0 place-items-center rounded-xl", accents[accent])}>
            <Icon className="h-5 w-5" />
          </span>
        ) : null}
      </div>
      {helper ? <p className="mt-2 text-xs font-semibold text-[var(--color-muted)]">{helper}</p> : null}
    </article>
  );
}

export function StatusBadge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "success" | "danger" | "warning" | "gold";
}) {
  const tones = {
    danger: "border-red-200 bg-red-50 text-red-700",
    gold: "border-amber-200 bg-amber-50 text-amber-800",
    neutral: "border-stone-200 bg-stone-100 text-stone-700",
    success: "border-green-200 bg-green-50 text-green-700",
    warning: "border-yellow-200 bg-yellow-50 text-yellow-800",
  };

  return (
    <span className={clsx("inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-black uppercase tracking-wide", tones[tone])}>
      {children}
    </span>
  );
}

export function EmptyState({
  action,
  description,
  title,
}: {
  action?: ReactNode;
  description: string;
  title: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-6 text-center shadow-sm">
      <h3 className="text-base font-black text-stone-950">{title}</h3>
      <p className="mx-auto mt-1 max-w-md text-sm text-[var(--color-muted)]">{description}</p>
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function TableShell({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white shadow-sm">
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}
