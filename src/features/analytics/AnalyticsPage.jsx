import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  FolderKanban,
  CheckCircle2,
  AlertTriangle,
  BarChart3,
} from "lucide-react";
import { isPast, parseISO, startOfDay } from "date-fns";

import { useProjects } from "@/hooks/useProjects";
import { useTasks }    from "@/hooks/useTasks";

// Reuse dashboard charts
import TasksByStatusChart   from "@/features/dashboard/components/TasksByStatusChart";
import ProjectProgressChart from "@/features/dashboard/components/ProjectProgressChart";

// New analytics-specific components
import TasksPerUserChart  from "./components/TasksPerUserChart";
import OverdueTasksList   from "./components/OverdueTasksList";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const today = startOfDay(new Date());

function isOverdue(task) {
  if (!task.exp_end_date) return false;
  if (["Completed", "Cancelled"].includes(task.status)) return false;
  try { return isPast(startOfDay(parseISO(task.exp_end_date))); }
  catch { return false; }
}

// ─── SummaryCard ──────────────────────────────────────────────────────────────
function SummaryCard({ icon: Icon, label, value, sub, iconBg, iconColor, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: index * 0.06 }}
      className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
        <Icon size={19} className={iconColor} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
        <p className="mt-0.5 font-display text-2xl font-bold leading-none text-slate-900">{value ?? "—"}</p>
        {sub && <p className="mt-1 text-[11px] text-slate-400">{sub}</p>}
      </div>
    </motion.div>
  );
}

// ─── SummaryCard skeleton ──────────────────────────────────────────────────────
function SummaryCardSkeleton() {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="h-11 w-11 animate-pulse rounded-xl bg-slate-100" />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-20 animate-pulse rounded-full bg-slate-100" />
        <div className="h-7 w-12 animate-pulse rounded-lg bg-slate-200" />
        <div className="h-2.5 w-28 animate-pulse rounded-full bg-slate-100" />
      </div>
    </div>
  );
}

// ─── Section header ────────────────────────────────────────────────────────────
function SectionHeader({ title, subtitle }) {
  return (
    <div>
      <h2 className="font-display text-base font-semibold text-slate-800">{title}</h2>
      {subtitle && <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>}
    </div>
  );
}

// ─── AnalyticsPage ────────────────────────────────────────────────────────────
export default function AnalyticsPage() {
  // ── Data fetching ──────────────────────────────────────────────────────────
  const {
    data:      projectsData,
    isPending: projectsLoading,
    isError:   projectsError,
  } = useProjects({ limit: 200 });

  const {
    data:      tasksData,
    isPending: tasksLoading,
    isError:   tasksError,
  } = useTasks({ limit: 500 });

  // const {
  //   data:      usersData,
  //   isPending: usersLoading,
  // } = useUsers();

  const projects = projectsData?.data ?? [];
  const tasks    = tasksData?.data    ?? [];
  // const users    = usersData?.data    ?? [];

  // ── Derived metrics ────────────────────────────────────────────────────────
  const metrics = useMemo(() => {
    const completed  = tasks.filter((t) => t.status === "Completed").length;
    const overdue    = tasks.filter(isOverdue).length;
    const inProgress = tasks.filter((t) => t.status === "Working").length;
    const compRate   = tasks.length > 0
      ? Math.round((completed / tasks.length) * 100)
      : 0;
    const avgProgress = projects.length > 0
      ? Math.round(
          projects.reduce((s, p) => s + (p.percent_complete ?? 0), 0) / projects.length
        )
      : 0;
    return { completed, overdue, inProgress, compRate, avgProgress };
  }, [tasks, projects]);

  const anyLoading = tasksLoading || projectsLoading;

  return (
    <div className="flex flex-col gap-8">

      {/* ── Page heading ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Analytics</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Insights across all ERPNext projects and tasks.
          </p>
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50">
          <BarChart3 size={18} className="text-indigo-500" />
        </div>
      </div>

      {/* ── Summary strip ── */}
      <section>
        <SectionHeader
          title="Summary"
          subtitle="High-level metrics across the full dataset"
        />
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {anyLoading ? (
            Array.from({ length: 4 }).map((_, i) => <SummaryCardSkeleton key={i} />)
          ) : (
            <>
              <SummaryCard
                index={0}
                icon={FolderKanban}
                label="Total Projects"
                value={projects.length}
                sub={`Avg ${metrics.avgProgress}% complete`}
                iconBg="bg-indigo-50"
                iconColor="text-indigo-500"
              />
              <SummaryCard
                index={1}
                icon={TrendingUp}
                label="In Progress"
                value={metrics.inProgress}
                sub="Tasks with status Working"
                iconBg="bg-amber-50"
                iconColor="text-amber-500"
              />
              <SummaryCard
                index={2}
                icon={CheckCircle2}
                label="Completion Rate"
                value={`${metrics.compRate}%`}
                sub={`${metrics.completed} of ${tasks.length} tasks done`}
                iconBg="bg-emerald-50"
                iconColor="text-emerald-500"
              />
              <SummaryCard
                index={3}
                icon={AlertTriangle}
                label="Overdue Tasks"
                value={metrics.overdue}
                sub={metrics.overdue === 0 ? "All on track" : "Needs attention"}
                iconBg={metrics.overdue > 0 ? "bg-rose-50"   : "bg-slate-50"}
                iconColor={metrics.overdue > 0 ? "text-rose-500" : "text-slate-400"}
              />
            </>
          )}
        </div>
      </section>

      {/* ── Row 1: Status + Project Progress ── */}
      <section>
        <SectionHeader
          title="Distribution"
          subtitle="Task status breakdown and per-project completion"
        />
        <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <TasksByStatusChart
            tasks={tasks}
            loading={tasksLoading}
            isError={tasksError}
          />
          <ProjectProgressChart
            projects={projects}
            loading={projectsLoading}
            isError={projectsError}
          />
        </div>
      </section>

      {/* ── Row 2: Per-user + Overdue ── */}
      <section>
        <SectionHeader
          title="Team & Health"
          subtitle="Task ownership per team member and overdue alerts"
        />
        <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* <TasksPerUserChart
            tasks={tasks}
            users={users}
            loading={tasksLoading || usersLoading}
            isError={tasksError}
          /> */}
          <OverdueTasksList
            tasks={tasks}
            loading={tasksLoading}
            isError={tasksError}
          />
        </div>
      </section>

    </div>
  );
}