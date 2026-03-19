import { useMemo } from "react";
import { motion } from "framer-motion";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Calendar, User, GripVertical, AlertCircle, Flag } from "lucide-react";
import { format, parseISO, isPast, isToday } from "date-fns";
import { cn } from "@/lib/utils";

// ─── Priority config ──────────────────────────────────────────────────────────
const PRIORITY_CONFIG = {
  Urgent: { label: "Urgent", classes: "bg-rose-50 text-rose-600 ring-rose-200/60",   dot: "bg-rose-500"   },
  High:   { label: "High",   classes: "bg-orange-50 text-orange-600 ring-orange-200/60", dot: "bg-orange-400" },
  Medium: { label: "Medium", classes: "bg-amber-50 text-amber-600 ring-amber-200/60", dot: "bg-amber-400"  },
  Low:    { label: "Low",    classes: "bg-slate-50 text-slate-500 ring-slate-200/60",  dot: "bg-slate-300"  },
};

function formatDate(dateStr) {
  if (!dateStr) return null;
  try { return format(parseISO(dateStr), "MMM d"); }
  catch { return null; }
}

function getInitials(name = "") {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase() || "?";
}

// ─── TaskCard ─────────────────────────────────────────────────────────────────
/**
 * @param {Object}  props
 * @param {Object}  props.task
 * @param {boolean} props.isDragging  - true while this card is being dragged (overlay clone)
 */
export default function TaskCard({ task, isDragging = false }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: task.name });

  const style = {
    transform:  CSS.Transform.toString(transform),
    transition,
    opacity:    isSortableDragging ? 0.4 : 1,
  };

  const priority    = PRIORITY_CONFIG[task.priority] ?? PRIORITY_CONFIG.Low;
  const dueDate     = formatDate(task.exp_end_date);
  const isOverdue   = task.exp_end_date && isPast(parseISO(task.exp_end_date)) && task.status !== "Completed";
  const isDueToday  = task.exp_end_date && isToday(parseISO(task.exp_end_date));

  const assignedName = useMemo(() => {
    const raw = task.assigned_to ?? task._assign ?? "";
    if (!raw) return null;
    // _assign can be a JSON array of emails: ["user@example.com"]
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed[0];
    } catch { /* not JSON */ }
    return raw;
  }, [task]);

  return (
    <div ref={setNodeRef} style={style} className="touch-none">
      <motion.div
        whileHover={!isSortableDragging ? { y: -2, boxShadow: "0 6px 20px -4px rgba(99,102,241,0.15)" } : {}}
        transition={{ duration: 0.15 }}
        className={cn(
          "group relative flex flex-col gap-3 rounded-xl border bg-white p-3.5",
          "cursor-grab active:cursor-grabbing",
          isDragging
            ? "border-indigo-300 shadow-xl shadow-indigo-100/60 ring-2 ring-indigo-400/30"
            : "border-slate-200 shadow-sm hover:border-indigo-200",
          isSortableDragging && "opacity-40"
        )}
        {...attributes}
        {...listeners}
      >
        {/* ── Drag affordance strip ── */}
        <div className="absolute left-0 top-0 flex h-full w-1 flex-col items-center justify-center rounded-l-xl opacity-0 transition-opacity group-hover:opacity-100">
          <GripVertical size={12} className="text-slate-300" />
        </div>

        {/* ── Priority + subject ── */}
        <div className="flex items-start justify-between gap-2 pl-1">
          <p className={cn(
            "flex-1 text-[13px] font-semibold leading-snug text-slate-800",
            "line-clamp-2 group-hover:text-indigo-700 transition-colors duration-150"
          )}>
            {task.subject}
          </p>

          {task.priority && (
            <span className={cn(
              "inline-flex shrink-0 items-center gap-1 rounded-full px-1.5 py-0.5",
              "text-[10px] font-semibold ring-1",
              priority.classes
            )}>
              <span className={cn("h-1.5 w-1.5 rounded-full", priority.dot)} />
              {priority.label}
            </span>
          )}
        </div>

        {/* ── Task name / ID ── */}
        {task.name && (
          <p className="pl-1 text-[10px] font-mono text-slate-300">{task.name}</p>
        )}

        {/* ── Footer: due date + assignee ── */}
        <div className="flex items-center justify-between gap-2 pl-1">
          {/* Due date */}
          {dueDate ? (
            <div className={cn(
              "flex items-center gap-1 text-[11px] font-medium",
              isOverdue  ? "text-rose-500"  :
              isDueToday ? "text-amber-500" :
                           "text-slate-400"
            )}>
              {isOverdue
                ? <AlertCircle size={11} className="shrink-0" />
                : <Calendar    size={11} className="shrink-0" />
              }
              {isOverdue ? "Overdue" : isDueToday ? "Today" : dueDate}
            </div>
          ) : (
            <span />
          )}

          {/* Assignee avatar */}
          {assignedName && (
            <div
              className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
                "bg-gradient-to-br from-violet-400 to-indigo-500",
                "text-[9px] font-bold text-white ring-1 ring-white"
              )}
              title={assignedName}
            >
              {getInitials(assignedName.split("@")[0])}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}