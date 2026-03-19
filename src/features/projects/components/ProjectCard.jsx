import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Calendar, ArrowRight, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { format, parseISO, isPast } from "date-fns";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

// ─── Status config ─────────────────────────────────────────────────────────────
const STATUS_STYLES = {
  Open:      "bg-indigo-50 text-indigo-600 ring-indigo-200/60",
  Completed: "bg-emerald-50 text-emerald-600 ring-emerald-200/60",
  Cancelled: "bg-slate-100 text-slate-500 ring-slate-200/60",
};

const PROGRESS_COLOR = (pct) => {
  if (pct >= 80) return "bg-emerald-500";
  if (pct >= 50) return "bg-indigo-500";
  if (pct >= 25) return "bg-amber-400";
  return "bg-rose-400";
};

function formatDate(dateStr) {
  if (!dateStr) return null;
  try { return format(parseISO(dateStr), "MMM d, yyyy"); }
  catch { return dateStr; }
}

function isDueSoon(dateStr) {
  if (!dateStr) return false;
  try {
    const d = parseISO(dateStr);
    const diff = (d - new Date()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 7;
  } catch { return false; }
}

// ─── ContextMenu ──────────────────────────────────────────────────────────────
function ContextMenu({ onEdit, onDelete }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        className={cn(
          "flex h-7 w-7 items-center justify-center rounded-lg",
          "text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        )}
        aria-label="Project options"
      >
        <MoreVertical size={15} />
      </button>

      {open && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.12 }}
          className={cn(
            "absolute right-0 top-8 z-20 w-36 overflow-hidden",
            "rounded-lg border border-slate-200 bg-white shadow-lg shadow-slate-200/60"
          )}
        >
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(); setOpen(false); }}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
          >
            <Pencil size={13} /> Edit Project
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); setOpen(false); }}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-500 hover:bg-rose-50"
          >
            <Trash2 size={13} /> Delete
          </button>
        </motion.div>
      )}
    </div>
  );
}

// ─── ProjectCard ──────────────────────────────────────────────────────────────
/**
 * @param {Object}   props
 * @param {Object}   props.project
 * @param {number}   props.index       - for stagger animation
 * @param {Function} props.onEdit
 * @param {Function} props.onDelete
 */
export default function ProjectCard({ project, index = 0, onEdit, onDelete }) {
  const navigate = useNavigate();
  const pct       = Math.round(project.percent_complete ?? 0);
  const dueDate   = formatDate(project.expected_end_date);
  const overdue   = project.expected_end_date
    ? isPast(parseISO(project.expected_end_date)) && project.status !== "Completed"
    : false;
  const dueSoon   = isDueSoon(project.expected_end_date) && project.status !== "Completed";

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: index * 0.05, ease: "easeOut" }}
      onClick={() => navigate(`/projects/${project.name}`)}
      className={cn(
        "group relative flex cursor-pointer flex-col gap-4 rounded-xl",
        "border border-slate-200 bg-white p-5 shadow-sm",
        "transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-200",
        "hover:shadow-md hover:shadow-indigo-100/40"
      )}
    >
      {/* ── Header row ── */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-display text-sm font-semibold text-slate-800 group-hover:text-indigo-600">
            {project.project_name || project.name}
          </h3>
          {project.company && (
            <p className="mt-0.5 truncate text-[11px] text-slate-400">{project.company}</p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <span className={cn(
            "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1",
            STATUS_STYLES[project.status] ?? "bg-slate-100 text-slate-500 ring-slate-200/60"
          )}>
            {project.status ?? "Unknown"}
          </span>
          <ContextMenu onEdit={onEdit} onDelete={onDelete} />
        </div>
      </div>

      {/* ── Progress ── */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-slate-400">Progress</span>
          <span className={cn(
            "text-[11px] font-semibold",
            pct >= 80 ? "text-emerald-600" : pct >= 50 ? "text-indigo-600" : "text-slate-500"
          )}>
            {pct}%
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <motion.div
            className={cn("h-full rounded-full", PROGRESS_COLOR(pct))}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.6, delay: index * 0.05 + 0.15, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="flex items-center justify-between">
        {dueDate ? (
          <div className={cn(
            "flex items-center gap-1.5 text-[11px] font-medium",
            overdue   ? "text-rose-500"  :
            dueSoon   ? "text-amber-500" :
                        "text-slate-400"
          )}>
            <Calendar size={12} />
            <span>{overdue ? "Overdue · " : dueSoon ? "Due soon · " : ""}{dueDate}</span>
          </div>
        ) : (
          <span className="text-[11px] text-slate-300">No due date</span>
        )}

        <div className={cn(
          "flex h-6 w-6 items-center justify-center rounded-full",
          "bg-slate-100 text-slate-400 transition-all duration-200",
          "group-hover:bg-indigo-500 group-hover:text-white"
        )}>
          <ArrowRight size={11} />
        </div>
      </div>
    </motion.div>
  );
}