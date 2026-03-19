import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, CalendarX, CheckCircle2, Clock } from "lucide-react";
import { formatDistanceToNow, parseISO, isPast, startOfDay } from "date-fns";
import { cn } from "@/lib/utils";

// ─── Priority dot colours ──────────────────────────────────────────────────────
const PRIORITY_DOT = {
  Urgent: "bg-rose-500",
  High:   "bg-orange-400",
  Medium: "bg-amber-400",
  Low:    "bg-slate-300",
};

function isOverdue(task) {
  if (!task.exp_end_date) return false;
  if (["Completed", "Cancelled"].includes(task.status)) return false;
  try {
    return isPast(startOfDay(parseISO(task.exp_end_date)));
  } catch {
    return false;
  }
}

function relativeDate(dateStr) {
  try {
    return formatDistanceToNow(parseISO(dateStr), { addSuffix: true });
  } catch {
    return dateStr;
  }
}

// ─── Skeleton ──────────────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="flex flex-col divide-y divide-slate-100">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 py-3.5">
          <div className="mt-1 h-2 w-2 shrink-0 animate-pulse rounded-full bg-slate-200" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-3/4 animate-pulse rounded-full bg-slate-100" />
            <div className="h-3 w-1/2 animate-pulse rounded-full bg-slate-100" />
          </div>
          <div className="h-4 w-16 animate-pulse rounded-full bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

// ─── OverdueTasksList ─────────────────────────────────────────────────────────
/**
 * @param {Object}   props
 * @param {Array}    props.tasks    - flat task list
 * @param {boolean}  props.loading
 * @param {boolean}  props.isError
 */
export default function OverdueTasksList({
  tasks   = [],
  loading = false,
  isError = false,
}) {
  const overdueTasks = useMemo(
    () =>
      tasks
        .filter(isOverdue)
        .sort((a, b) => {
          // Most overdue first
          try {
            return parseISO(a.exp_end_date) - parseISO(b.exp_end_date);
          } catch {
            return 0;
          }
        }),
    [tasks]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.18 }}
      className="flex flex-col rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      {/* Header */}
      <div className="mb-1 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg",
            overdueTasks.length > 0 ? "bg-rose-50" : "bg-slate-50"
          )}>
            <AlertTriangle
              size={15}
              className={overdueTasks.length > 0 ? "text-rose-500" : "text-slate-400"}
            />
          </div>
          <h2 className="font-display text-sm font-semibold text-slate-800">
            Overdue Tasks
          </h2>
        </div>

        {!loading && !isError && (
          <span className={cn(
            "rounded-full px-2 py-0.5 text-xs font-semibold",
            overdueTasks.length > 0
              ? "bg-rose-50 text-rose-600"
              : "bg-slate-100 text-slate-400"
          )}>
            {overdueTasks.length}
          </span>
        )}
      </div>
      <p className="mb-4 text-xs text-slate-400">
        Tasks past their expected end date
      </p>

      {/* Content */}
      <div className="min-h-[200px]">
        {loading ? (
          <Skeleton />
        ) : isError ? (
          <div className="flex h-48 flex-col items-center justify-center gap-2 text-center">
            <CalendarX size={22} className="text-slate-300" />
            <p className="text-sm text-slate-400">Failed to load tasks.</p>
          </div>
        ) : overdueTasks.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex h-48 flex-col items-center justify-center gap-3 text-center"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50">
              <CheckCircle2 size={22} className="text-emerald-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700">All on track!</p>
              <p className="text-xs text-slate-400">No overdue tasks right now.</p>
            </div>
          </motion.div>
        ) : (
          <div className="flex flex-col divide-y divide-slate-100 overflow-y-auto" style={{ maxHeight: 340 }}>
            <AnimatePresence initial={false}>
              {overdueTasks.map((task, i) => (
                <motion.div
                  key={task.name}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: i * 0.04 }}
                  className="flex items-start gap-3 py-3.5 first:pt-0"
                >
                  {/* Priority dot */}
                  <div className="mt-1.5 flex shrink-0 flex-col items-center gap-1">
                    <span
                      className={cn(
                        "h-2 w-2 rounded-full",
                        PRIORITY_DOT[task.priority] ?? "bg-slate-300"
                      )}
                    />
                  </div>

                  {/* Text block */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-slate-800">
                      {task.subject}
                    </p>
                    <div className="mt-0.5 flex items-center gap-2">
                      {task.project && (
                        <span className="truncate text-[11px] text-slate-400">
                          {task.project}
                        </span>
                      )}
                      {task.project && task.exp_end_date && (
                        <span className="text-slate-200">·</span>
                      )}
                      {task.priority && (
                        <span className={cn(
                          "text-[10px] font-semibold",
                          task.priority === "Urgent" ? "text-rose-500"   :
                          task.priority === "High"   ? "text-orange-500" :
                                                       "text-slate-400"
                        )}>
                          {task.priority}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Due date badge */}
                  <div className="shrink-0 text-right">
                    <div className="flex items-center gap-1 rounded-md bg-rose-50 px-2 py-1">
                      <Clock size={10} className="text-rose-400" />
                      <span className="whitespace-nowrap text-[10px] font-semibold text-rose-500">
                        {relativeDate(task.exp_end_date)}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Footer count when there are many */}
      {!loading && !isError && overdueTasks.length > 5 && (
        <p className="mt-3 border-t border-slate-100 pt-3 text-center text-xs text-slate-400">
          Showing all {overdueTasks.length} overdue tasks
        </p>
      )}
    </motion.div>
  );
}