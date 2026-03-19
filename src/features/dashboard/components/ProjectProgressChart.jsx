import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ResponsiveContainer,
  LabelList,
} from "recharts";
import { motion } from "framer-motion";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function progressColor(pct) {
  if (pct >= 80) return "#10b981"; // emerald
  if (pct >= 50) return "#6366f1"; // indigo
  if (pct >= 25) return "#f59e0b"; // amber
  return "#f43f5e";                // rose
}

function truncate(str, n = 18) {
  return str?.length > n ? str.slice(0, n) + "…" : str;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function ChartSkeleton() {
  const bars = [65, 40, 90, 30, 75, 55];
  return (
    <div className="flex h-full items-end justify-around gap-3 pb-6 pt-4">
      {bars.map((h, i) => (
        <div
          key={i}
          className="flex-1 animate-pulse rounded-t-md bg-slate-100"
          style={{ height: `${h}%` }}
        />
      ))}
    </div>
  );
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const pct = payload[0]?.value ?? 0;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 shadow-lg">
      <p className="mb-1 max-w-[160px] truncate text-xs font-semibold text-slate-700">
        {label}
      </p>
      <div className="flex items-center gap-2">
        <div
          className="h-2 rounded-full"
          style={{ width: 40, backgroundColor: progressColor(pct) }}
        />
        <span className="text-sm font-bold text-slate-900">{pct}%</span>
      </div>
    </div>
  );
}

// ─── ProjectProgressChart ─────────────────────────────────────────────────────
/**
 * @param {Object}  props
 * @param {Array}   props.projects  - raw project list from useProjects()
 * @param {boolean} props.loading
 * @param {boolean} props.isError
 */
export default function ProjectProgressChart({ projects = [], loading = false, isError = false }) {
  const data = useMemo(() =>
    projects
      .slice(0, 10)                      // cap to avoid crowding
      .map((p) => ({
        name:     p.project_name || p.name,
        shortName: truncate(p.project_name || p.name),
        progress:  Math.round(p.percent_complete ?? 0),
      }))
      .sort((a, b) => b.progress - a.progress),
    [projects]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.25 }}
      className="flex flex-col rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      {/* Header */}
      <div className="mb-1 flex items-center justify-between">
        <h2 className="font-display text-sm font-semibold text-slate-800">
          Project Progress
        </h2>
        {!loading && !isError && (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
            {projects.length} projects
          </span>
        )}
      </div>
      <p className="mb-4 text-xs text-slate-400">Completion percentage per project</p>

      {/* Legend pills */}
      {!loading && !isError && data.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {[
            { label: "< 25%",   color: "#f43f5e" },
            { label: "25–50%",  color: "#f59e0b" },
            { label: "50–80%",  color: "#6366f1" },
            { label: "≥ 80%",   color: "#10b981" },
          ].map(({ label, color }) => (
            <span key={label} className="flex items-center gap-1.5 text-[11px] text-slate-500">
              <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
              {label}
            </span>
          ))}
        </div>
      )}

      {/* Chart area */}
      <div className="flex-1" style={{ minHeight: 220 }}>
        {loading ? (
          <ChartSkeleton />
        ) : isError ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-slate-400">Failed to load data.</p>
          </div>
        ) : data.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-slate-400">No projects found.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={data}
              margin={{ top: 16, right: 8, left: -20, bottom: 0 }}
              barCategoryGap="30%"
            >
              <CartesianGrid
                vertical={false}
                strokeDasharray="3 3"
                stroke="#f1f5f9"
              />
              <XAxis
                dataKey="shortName"
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
                interval={0}
                angle={data.length > 5 ? -30 : 0}
                textAnchor={data.length > 5 ? "end" : "middle"}
                height={data.length > 5 ? 48 : 24}
              />
              <YAxis
                domain={[0, 100]}
                tickFormatter={(v) => `${v}%`}
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
                ticks={[0, 25, 50, 75, 100]}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: "#f8fafc", radius: 6 }}
              />
              <Bar
                dataKey="progress"
                radius={[6, 6, 0, 0]}
                maxBarSize={48}
                animationDuration={600}
              >
                {data.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={progressColor(entry.progress)}
                    fillOpacity={0.9}
                  />
                ))}
                <LabelList
                  dataKey="progress"
                  position="top"
                  formatter={(v) => `${v}%`}
                  style={{ fontSize: 10, fill: "#64748b", fontWeight: 600 }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </motion.div>
  );
}