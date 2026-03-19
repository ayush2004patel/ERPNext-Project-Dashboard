import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import TaskCard from "./TaskCard";

// ─── Column accent colours ─────────────────────────────────────────────────────
const COLUMN_STYLES = {
  "Open":           {
    header:  "text-indigo-600",
    dot:     "bg-indigo-500",
    count:   "bg-indigo-50 text-indigo-500",
    ring:    "ring-indigo-400/30",
    bg:      "bg-indigo-50/50",
  },
  "Working":        {
    header:  "text-amber-600",
    dot:     "bg-amber-400",
    count:   "bg-amber-50 text-amber-500",
    ring:    "ring-amber-400/30",
    bg:      "bg-amber-50/40",
  },
  "Pending Review": {
    header:  "text-violet-600",
    dot:     "bg-violet-500",
    count:   "bg-violet-50 text-violet-500",
    ring:    "ring-violet-400/30",
    bg:      "bg-violet-50/40",
  },
  "Completed":      {
    header:  "text-emerald-600",
    dot:     "bg-emerald-500",
    count:   "bg-emerald-50 text-emerald-600",
    ring:    "ring-emerald-400/30",
    bg:      "bg-emerald-50/30",
  },
};

const FALLBACK_STYLE = {
  header: "text-slate-600",
  dot:    "bg-slate-400",
  count:  "bg-slate-100 text-slate-500",
  ring:   "ring-slate-300/30",
  bg:     "bg-slate-50/60",
};

// ─── KanbanColumn ─────────────────────────────────────────────────────────────
/**
 * @param {Object}   props
 * @param {string}   props.id       - column status string, used as droppable id
 * @param {string}   props.title
 * @param {Array}    props.tasks
 * @param {number}   props.index    - for stagger animation
 */
export default function KanbanColumn({ id, title, tasks, index = 0 }) {
  const style = COLUMN_STYLES[id] ?? FALLBACK_STYLE;
  const taskIds = tasks.map((t) => t.name);

  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.06, ease: "easeOut" }}
      className="flex min-h-0 w-72 shrink-0 flex-col xl:w-80"
    >
      {/* ── Column header ── */}
      <div className="mb-3 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className={cn("h-2 w-2 rounded-full", style.dot)} />
          <h3 className={cn("font-display text-sm font-semibold", style.header)}>
            {title}
          </h3>
        </div>
        <span className={cn(
          "rounded-full px-2 py-0.5 text-[10px] font-bold",
          style.count
        )}>
          {tasks.length}
        </span>
      </div>

      {/* ── Droppable task list ── */}
      <div
        ref={setNodeRef}
        className={cn(
          "flex flex-1 flex-col gap-2.5 overflow-y-auto rounded-xl p-2.5",
          "min-h-[120px] transition-all duration-200",
          style.bg,
          isOver
            ? cn("ring-2", style.ring, "scale-[1.01]")
            : "ring-1 ring-slate-200/60"
        )}
        style={{ maxHeight: "calc(100vh - 220px)" }}
      >
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {tasks.length === 0 ? (
            <div className={cn(
              "flex flex-1 flex-col items-center justify-center rounded-lg",
              "border-2 border-dashed border-slate-200 py-8",
              isOver && "border-indigo-300 bg-indigo-50/50"
            )}>
              <p className="text-xs text-slate-300">
                {isOver ? "Drop here" : "No tasks"}
              </p>
            </div>
          ) : (
            tasks.map((task) => (
              <TaskCard key={task.name} task={task} />
            ))
          )}
        </SortableContext>
      </div>
    </motion.div>
  );
}