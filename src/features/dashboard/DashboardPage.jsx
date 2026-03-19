import { useMemo } from "react";
import { isAfter, parseISO, startOfDay } from "date-fns";
import {
  FolderKanban,
  ListChecks,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

import { useProjects } from "@/hooks/useProjects";
import { useTasks }    from "@/hooks/useTasks";

import StatCard              from "./components/StatCard";
import TasksByStatusChart    from "./components/TasksByStatusChart";
import ProjectProgressChart  from "./components/ProjectProgressChart";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const today = startOfDay(new Date());

function isOverdue(task) {
  if (!task.exp_end_date) return false;
  if (task.status === "Completed" || task.status === "Cancelled") return false;
  try {
    return isAfter(today, parseISO(task.exp_end_date));
  } catch {
    return false;
  }
}

// ─── ErrorBanner ─────────────────────────────────────────────────────────────
function ErrorBanner({ message }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
      <AlertTriangle size={16} className="shrink-0 text-rose-500" />
      <span>{message}</span>
    </div>
  );
}

// ─── SectionHeader ────────────────────────────────────────────────────────────
function SectionHeader({ title, subtitle }) {
  return (
    <div>
      <h2 className="font-display text-base font-semibold text-slate-800">{title}</h2>
      {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
    </div>
  );
}

// ─── DashboardPage ────────────────────────────────────────────────────────────
export default function DashboardPage() {
  // ── Data fetching ──────────────────────────────────────────────────────────
  const {
    data:      projectsData,
    isPending: projectsLoading,
    isError:   projectsError,
  } = useProjects({ limit: 100 });

  const {
    data:      tasksData,
    isPending: tasksLoading,
    isError:   tasksError,
  } = useTasks({ limit: 500 });

  const projects = projectsData?.data ?? [];
  const tasks    = tasksData?.data    ?? [];

  // ── Derived stats ──────────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    totalProjects:    projects.length,
    totalTasks:       tasks.length,
    completedTasks:   tasks.filter((t) => t.status === "Completed").length,
    overdueTasks:     tasks.filter(isOverdue).length,
  }), [projects, tasks]);

  const anyLoading = projectsLoading || tasksLoading;
  const anyError   = projectsError   || tasksError;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-8">

      {/* ── Page heading ── */}
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-bold text-slate-900">
          Dashboard
        </h1>
        <p className="text-sm text-slate-500">
          Live overview of your projects and tasks from ERPNext.
        </p>
      </div>

      {/* ── Error banners ── */}
      {projectsError && (
        <ErrorBanner message="Could not load projects — check your ERPNext connection." />
      )}
      {tasksError && (
        <ErrorBanner message="Could not load tasks — check your ERPNext connection." />
      )}

      {/* ── Stat Cards ── */}
      <section aria-label="Summary statistics">
        <SectionHeader
          title="Overview"
          subtitle="Aggregated totals across all ERPNext projects"
        />
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            index={0}
            loading={projectsLoading}
            title="Total Projects"
            value={stats.totalProjects}
            subtitle="Active ERPNext projects"
            icon={FolderKanban}
            iconColor="text-indigo-500"
            iconBg="bg-indigo-50"
          />
          <StatCard
            index={1}
            loading={tasksLoading}
            title="Total Tasks"
            value={stats.totalTasks}
            subtitle="Across all projects"
            icon={ListChecks}
            iconColor="text-violet-500"
            iconBg="bg-violet-50"
          />
          <StatCard
            index={2}
            loading={tasksLoading}
            title="Completed Tasks"
            value={stats.completedTasks}
            subtitle={
              stats.totalTasks > 0
                ? `${Math.round((stats.completedTasks / stats.totalTasks) * 100)}% completion rate`
                : "No tasks yet"
            }
            icon={CheckCircle2}
            iconColor="text-emerald-500"
            iconBg="bg-emerald-50"
            trend={
              stats.completedTasks > 0
                ? `${stats.completedTasks} done`
                : undefined
            }
            trendDir="up"
          />
          <StatCard
            index={3}
            loading={tasksLoading}
            title="Overdue Tasks"
            value={stats.overdueTasks}
            subtitle="Past expected end date"
            icon={AlertTriangle}
            iconColor={stats.overdueTasks > 0 ? "text-rose-500" : "text-slate-400"}
            iconBg={stats.overdueTasks > 0 ? "bg-rose-50" : "bg-slate-50"}
            trend={
              stats.overdueTasks > 0 ? "Needs attention" : "All on track"
            }
            trendDir={stats.overdueTasks > 0 ? "down" : "up"}
          />
        </div>
      </section>

      {/* ── Charts ── */}
      <section aria-label="Charts">
        <SectionHeader
          title="Analytics"
          subtitle="Visual breakdown of tasks and project health"
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

      {/* ── Recent Projects table ── */}
      {!anyLoading && projects.length > 0 && (
        <section aria-label="Recent projects">
          <SectionHeader
            title="Recent Projects"
            subtitle="Last modified projects"
          />
          <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Project
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Status
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Progress
                  </th>
                  <th className="hidden px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400 sm:table-cell">
                    Due Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {projects.slice(0, 6).map((project) => {
                  const pct = Math.round(project.percent_complete ?? 0);
                  const statusColors = {
                    Open:       "bg-indigo-50 text-indigo-600",
                    Completed:  "bg-emerald-50 text-emerald-600",
                    Cancelled:  "bg-slate-100 text-slate-500",
                  };
                  return (
                    <tr
                      key={project.name}
                      className="group transition-colors duration-100 hover:bg-slate-50/60"
                    >
                      <td className="px-5 py-3.5">
                        <span className="font-medium text-slate-800">
                          {project.project_name || project.name}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                            statusColors[project.status] ?? "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {project.status ?? "—"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-indigo-500 transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-400">{pct}%</span>
                        </div>
                      </td>
                      <td className="hidden px-5 py-3.5 text-slate-400 sm:table-cell">
                        {project.expected_end_date ?? "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}