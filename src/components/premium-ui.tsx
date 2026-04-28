"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="space-y-2">
      {eyebrow ? (
        <p className="text-xs font-medium uppercase tracking-[0.28em] text-cyan-200/80">{eyebrow}</p>
      ) : null}
      <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">{title}</h2>
      {description ? <p className="max-w-2xl text-sm leading-6 text-slate-300">{description}</p> : null}
    </div>
  );
}

export function GlassCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`glass hover-lift rounded-[28px] ${className}`.trim()}>{children}</div>;
}

export function StatCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <GlassCard className="p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-3 text-cyan-200">
          <Icon className="size-5" />
        </div>
        {hint ? <span className="text-xs text-slate-400">{hint}</span> : null}
      </div>
      <p className="mt-6 text-sm text-slate-300">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-white">{value}</p>
    </GlassCard>
  );
}

export function StatusBadge({
  label,
  className = "",
}: {
  label: string;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] ${className}`.trim()}
    >
      {label}
    </span>
  );
}

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <GlassCard className="p-8 text-center">
      <p className="text-lg font-medium text-white">{title}</p>
      <p className="mt-2 text-sm text-slate-300">{description}</p>
    </GlassCard>
  );
}

export function ToastMessage({
  tone,
  message,
}: {
  tone: "success" | "error" | "info";
  message: string;
}) {
  const toneClassName =
    tone === "success"
      ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-100"
      : tone === "error"
        ? "border-rose-400/30 bg-rose-500/10 text-rose-100"
        : "border-cyan-400/30 bg-cyan-500/10 text-cyan-100";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border px-4 py-3 text-sm ${toneClassName}`.trim()}
    >
      {message}
    </motion.div>
  );
}

export function AnimatedCounter({
  value,
  suffix = "",
  label,
}: {
  value: string;
  suffix?: string;
  label: string;
}) {
  return (
    <GlassCard className="p-5">
      <p className="text-3xl font-semibold tracking-tight text-white">
        {value}
        {suffix}
      </p>
      <p className="mt-2 text-sm text-slate-300">{label}</p>
    </GlassCard>
  );
}

export function Modal({
  open,
  title,
  description,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="glass max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-[32px] p-6 sm:p-7"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold text-white">{title}</h3>
            {description ? <p className="mt-2 text-sm leading-6 text-slate-300">{description}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/10 bg-white/5 p-2 text-slate-300"
            aria-label="Close modal"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="mt-6">{children}</div>
      </motion.div>
    </div>
  );
}
