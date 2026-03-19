import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  FolderKanban,
  AlertTriangle,
  RefreshCw,
  Plus,
  Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useProject }  from "@/hooks/useProjects";
import { useTasks }    from "@/hooks/useTasks";
import KanbanBoard, { COLUMNS } from "./KanbanBoard";

// ─── Stat pill ────────────────────────────────────────────────────────────────
function StatPill({ label, value, color }) {
  return (
    <div className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 shadow-sm ring-1 ring-slate-200/80">
      <span className={cn("h-1.5 w-1.5 rounded-full", color)} />
      <span className="text-xs text-slate-400">{label}</span>
      <span className="text-xs font-semibold text-slate-700">{value}</span>
    </div>
  );
}

// ─── Board skeleton ───────────────────────────────────────────────────────────
function BoardSkeleton() {
  return (
    <div className="flex gap-4 overflow-x-hidden pb-4 pt-1">
      {COLUMNS.map((col) => (
        <div
          key={col.id}
          className="flex w-72 shrink-0 flex-col gap-2.5 rounded-xl bg-slate-50 p-2.5 ring-1 ring-slate-200/60 xl:w-80"
        >
          <div className="mb-1 flex items-center justify-between px-1">
            <div className="h-4 w-24 animate-pulse rounded-full bg-slate-200" />
            <div className="h-4 w-6 animate-pulse rounded-full bg-slate-100" />
          </div>
          {Array.from({ length: col.id === "Open" ? 3 : col.id === "Working" ? 2 : 1 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2.5 rounded-xl border border-slate-200 bg-white p-3.5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 w-full animate-pulse rounded-full bg-slate-100" />
                  <div className="h-3 w-3/4 animate-pulse rounded-full bg-slate-100" />
                </div>
                <div className="h-5 w-14 shrink-0 animate-pulse rounded-full bg-slate-100" />
              </div>
              <div className="flex items-center justify-between">
                <div className="h-3 w-16 animate-pulse rounded-full bg-slate-100" />
                <div className="h-5 w-5 animate-pulse rounded-full bg-slate-100" />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── ProjectBoardPage ─────────────────────────────────────────────────────────
export default function ProjectBoardPage() {
  const { id: projectId } = useParams();

  const {
    data:      project,
    isPending: projectLoading,
  } = useProject(projectId);

  const {
    data:      tasksData,
    isPending: tasksLoading,
    isError:   tasksError,
    error:     tasksErrorObj,
    refetch,
  } = useTasks(
    { projectId, limit: 500 },
    { enabled: Boolean(projectId) }
  );

  const tasks = tasksData?.data ?? [];

  // ── Stats ──────────────────────────────────────────────────────────────────
  const stats = COLUMNS.map((col) => ({
    ...col,
    count: tasks.filter((t) => t.status === col.id).length,
  }));

  const dotColors = {
    "Open":           "bg-indigo-500",
    "Working":        "bg-amber-400",
    "Pending Review": "bg-violet-500",
    "Completed":      "bg-emerald-500",
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5">

      {/* ── Breadcrumb back ── */}
      <div className="flex items-center gap-2">
        <Link
          to="/projects"
          className={cn(
            "flex items-center gap-1.5 text-sm font-medium text-slate-400",
            "transition-colors hover:text-indigo-600"
          )}
        >
          <ArrowLeft size={15} />
          Projects
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-sm font-medium text-slate-600">
          {projectLoading ? (
            <span className="inline-block h-4 w-32 animate-pulse rounded-full bg-slate-200" />
          ) : (
            project?.project_name ?? projectId
          )}
        </span>
      </div>

      {/* ── Page header ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50">
            <FolderKanban size={18} className="text-indigo-500" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold text-slate-900">
              {projectLoading
                ? <span className="inline-block h-6 w-48 animate-pulse rounded-full bg-slate-200" />
                : project?.project_name ?? projectId
              }
            </h1>
            <p className="mt-0.5 text-xs text-slate-400">
              {tasksLoading
                ? "Loading tasks…"
                : `${tasks.length} task${tasks.length !== 1 ? "s" : ""} · Kanban board`
              }
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={() => refetch()}
            disabled={tasksLoading}
            className={cn(
              "flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2",
              "text-xs font-medium text-slate-500 shadow-sm",
              "transition-colors hover:border-slate-300 hover:text-slate-700",
              "disabled:cursor-not-allowed disabled:opacity-50"
            )}
          >
            <RefreshCw size={13} className={tasksLoading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </motion.div>

      {/* ── Column stats pills ── */}
      {!tasksLoading && tasks.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="flex flex-wrap gap-2"
        >
          {stats.map((s) => (
            <StatPill
              key={s.id}
              label={s.title}
              value={s.count}
              color={dotColors[s.id]}
            />
          ))}
        </motion.div>
      )}

      {/* ── Error state ── */}
      {tasksError && (
        <div className={cn(
          "flex items-center gap-3 rounded-xl border border-rose-100 bg-rose-50",
          "px-4 py-3 text-sm text-rose-700"
        )}>
          <AlertTriangle size={15} className="shrink-0 text-rose-400" />
          <span>
            {tasksErrorObj?.message ?? "Failed to load tasks."}
          </span>
          <button
            onClick={() => refetch()}
            className="ml-auto text-xs font-semibold text-rose-600 hover:text-rose-800"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Board ── */}
      <div className="min-h-0 flex-1">
        {tasksLoading ? (
          <BoardSkeleton />
        ) : (
          <KanbanBoard tasks={tasks} />
        )}
      </div>
    </div>
  );
}