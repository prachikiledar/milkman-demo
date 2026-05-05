import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type AdminCardProps = {
  children: React.ReactNode;
  className?: string;
};

type AdminStatCardProps = {
  label: string;
  value: string;
  hint: string;
  icon: LucideIcon;
  tone?: "blue" | "success" | "warning" | "danger";
};

type AdminBadgeProps = {
  children: React.ReactNode;
  tone?: "blue" | "success" | "warning" | "danger";
  className?: string;
};

type AdminButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "outline";
};

type AdminFieldProps = {
  label: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
};

export function AdminCard({ children, className }: AdminCardProps) {
  return <section className={cn("admin-panel rounded-[28px] p-5 sm:p-6", className)}>{children}</section>;
}

export function AdminStatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "blue",
}: AdminStatCardProps) {
  const toneMap = {
    blue: "bg-[var(--admin-primary-soft)] text-[var(--admin-primary-strong)]",
    success: "bg-[var(--admin-success-soft)] text-[#1c8c5b]",
    warning: "bg-[var(--admin-warning-soft)] text-[#b06b00]",
    danger: "bg-[var(--admin-danger-soft)] text-[#d14646]",
  } as const;

  return (
    <article className="admin-kpi-card rounded-[26px] p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-[var(--admin-muted)]">{label}</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-[var(--admin-text)]">
            {value}
          </p>
        </div>
        <div
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-2xl",
            toneMap[tone],
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="mt-3 text-sm leading-6 text-[var(--admin-muted)]">{hint}</p>
    </article>
  );
}

export function AdminBadge({
  children,
  tone = "blue",
  className,
}: AdminBadgeProps) {
  const toneClass = {
    blue: "admin-badge-blue",
    success: "admin-badge-success",
    warning: "admin-badge-warning",
    danger: "admin-badge-danger",
  }[tone];

  return <span className={cn("admin-badge", toneClass, className)}>{children}</span>;
}

export function AdminButton({
  children,
  className,
  variant = "primary",
  type = "button",
  ...props
}: AdminButtonProps) {
  const variantClass = {
    primary: "admin-primary-button px-4 py-3 text-sm font-semibold",
    secondary: "admin-secondary-button px-4 py-3 text-sm font-semibold",
    outline: "admin-outline-button px-4 py-3 text-sm font-semibold",
  }[variant];

  return (
    <button type={type} className={cn(variantClass, className)} {...props}>
      {children}
    </button>
  );
}

export function AdminField({ label, hint, children, className }: AdminFieldProps) {
  return (
    <label className={cn("block space-y-2", className)}>
      <span className="block text-sm font-semibold text-[var(--admin-text)]">{label}</span>
      {children}
      {hint ? <span className="block text-xs text-[var(--admin-muted)]">{hint}</span> : null}
    </label>
  );
}

export const AdminInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(function AdminInput(props, ref) {
  return (
    <input
      {...props}
      ref={ref}
      className={cn(
        "w-full rounded-[18px] border border-[var(--admin-border)] bg-white px-4 py-3 text-sm text-[var(--admin-text)] outline-none transition placeholder:text-[var(--admin-muted)] focus:border-[var(--admin-primary)] focus:ring-4 focus:ring-[rgba(59,130,246,0.12)]",
        props.className,
      )}
    />
  );
});

export function AdminSelect(
  props: React.SelectHTMLAttributes<HTMLSelectElement>,
) {
  return (
    <select
      {...props}
      className={cn(
        "w-full rounded-[18px] border border-[var(--admin-border)] bg-white px-4 py-3 text-sm text-[var(--admin-text)] outline-none transition focus:border-[var(--admin-primary)] focus:ring-4 focus:ring-[rgba(59,130,246,0.12)]",
        props.className,
      )}
    />
  );
}

export function AdminTextarea(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement>,
) {
  return (
    <textarea
      {...props}
      className={cn(
        "min-h-[120px] w-full rounded-[18px] border border-[var(--admin-border)] bg-white px-4 py-3 text-sm text-[var(--admin-text)] outline-none transition placeholder:text-[var(--admin-muted)] focus:border-[var(--admin-primary)] focus:ring-4 focus:ring-[rgba(59,130,246,0.12)]",
        props.className,
      )}
    />
  );
}

export function AdminDivider({ className }: { className?: string }) {
  return <div className={cn("admin-divider my-6", className)} />;
}
