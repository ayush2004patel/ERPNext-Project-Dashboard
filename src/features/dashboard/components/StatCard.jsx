import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function StatCardSkeleton() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <div className="h-3.5 w-24 animate-pulse rounded-full bg-slate-200" />
          <div className="h-8 w-16 animate-pulse rounded-lg bg-slate-200" />
          <div className="h-3 w-32 animate-pulse rounded-full bg-slate-100" />
        </div>
        <div className="h-11 w-11 animate-pulse rounded-xl bg-slate-100" />
      </div>
    </div>
  );
}

// ─── StatCard ─────────────────────────────────────────────────────────────────
/**
 * @param {Object}  props
 * @param {string}  props.title
 * @param {number|string} props.value
 * @param {string}  [props.subtitle]      - small helper text below the value
 * @param {React.ElementType} props.icon  - lucide icon component
 * @param {string}  [props.iconColor]     - Tailwind text color class
 * @param {string}  [props.iconBg]        - Tailwind bg color class
 * @param {string}  [props.trend]         - e.g. "+12% this week"
 * @param {"up"|"down"|"neutral"} [props.trendDir]
 * @param {boolean} [props.loading]
 * @param {number}  [props.index]         - stagger animation index
 */
export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = "text-indigo-500",
  iconBg    = "bg-indigo-50",
  trend,
  trendDir  = "neutral",
  loading   = false,
  index     = 0,
}) {
  if (loading) return <StatCardSkeleton />;

  const trendColors = {
    up:      "text-emerald-600 bg-emerald-50",
    down:    "text-rose-500 bg-rose-50",
    neutral: "text-slate-500 bg-slate-100",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.07, ease: "easeOut" }}
      className={cn(
        "group relative overflow-hidden rounded-xl border border-slate-200",
        "bg-white p-6 shadow-sm",
        "transition-shadow duration-200 hover:shadow-md hover:shadow-slate-200/60"
      )}
    >
      {/* Subtle background accent */}
      <div
        className={cn(
          "absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-[0.06]",
          "transition-transform duration-300 group-hover:scale-125",
          iconBg.replace("bg-", "bg-")
        )}
      />

      <div className="relative flex items-start justify-between gap-4">
        {/* Text block */}
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
            {title}
          </p>

          <p className="mt-2 font-display text-3xl font-bold leading-none text-slate-800">
            {value ?? "—"}
          </p>

          {subtitle && (
            <p className="mt-1.5 text-xs text-slate-400">{subtitle}</p>
          )}

          {trend && (
            <span
              className={cn(
                "mt-3 inline-flex items-center gap-1 rounded-full px-2 py-0.5",
                "text-[11px] font-semibold",
                trendColors[trendDir]
              )}
            >
              {trendDir === "up" ? "↑" : trendDir === "down" ? "↓" : "•"} {trend}
            </span>
          )}
        </div>

        {/* Icon */}
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
            "transition-transform duration-200 group-hover:scale-110",
            iconBg
          )}
        >
          <Icon size={20} className={iconColor} strokeWidth={2} />
        </div>
      </div>
    </motion.div>
  );
}