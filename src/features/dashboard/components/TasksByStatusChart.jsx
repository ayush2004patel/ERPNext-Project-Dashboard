import { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CONFIG = [
  { key: "Open",           label: "Open",           color: "#6366f1" }, // indigo
  { key: "Working",        label: "Working",         color: "#f59e0b" }, // amber
  { key: "Pending Review", label: "Pending Review",  color: "#8b5cf6" }, // violet
  { key: "Completed",      label: "Completed",       color: "#10b981" }, // emerald
  { key: "Cancelled",      label: "Cancelled",       color: "#94a3b8" }, // slate
];

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function ChartSkeleton() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4">
      <div className="h-44 w-44 animate-pulse rounded-full bg-slate-100" />
      <div className="flex gap-3">
        {[80, 60, 90, 70].map((w, i) => (
          <div
            key={i}
            className="h-3 animate-pulse rounded-full bg-slate-100"
            style={{ width: w }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const { name, value, payload: innerPayload } = payload[0];
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-lg">
      <div className="flex items-center gap-2">
        <span
          className="inline-block h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: innerPayload.color }}
        />
        <span className="text-xs font-semibold text-slate-700">{name}</span>
      </div>
      <p className="mt-0.5 text-sm font-bold text-slate-900">{value} tasks</p>
    </div>
  );
}

// ─── Custom Legend ────────────────────────────────────────────────────────────
function CustomLegend({ payload }) {
  return (
    <ul className="flex flex-wrap justify-center gap-x-4 gap-y-2 pt-2">
      {payload?.map((entry) => (
        <li key={entry.value} className="flex items-center gap-1.5">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-xs text-slate-500">{entry.value}</span>
        </li>
      ))}
    </ul>
  );
}

// ─── TasksByStatusChart ───────────────────────────────────────────────────────
/**
 * @param {Object}   props
 * @param {Array}    props.tasks    - raw task list from useTasks()
 * @param {boolean}  props.loading
 * @param {boolean}  props.isError
 */
export default function TasksByStatusChart({ tasks = [], loading = false, isError = false }) {
  const data = useMemo(() => {
    const counts = {};
    for (const task of tasks) {
      counts[task.status] = (counts[task.status] ?? 0) + 1;
    }
    return STATUS_CONFIG
      .map(({ key, label, color }) => ({
        name:  label,
        value: counts[key] ?? 0,
        color,
      }))
      .filter((d) => d.value > 0);
  }, [tasks]);

  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.18 }}
      className="flex flex-col rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      {/* Header */}
      <div className="mb-1 flex items-center justify-between">
        <h2 className="font-display text-sm font-semibold text-slate-800">
          Tasks by Status
        </h2>
        {!loading && !isError && (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
            {total} total
          </span>
        )}
      </div>
      <p className="mb-4 text-xs text-slate-400">Distribution across all projects</p>

      {/* Chart area */}
      <div className="flex flex-1 items-center justify-center" style={{ minHeight: 240 }}>
        {loading ? (
          <ChartSkeleton />
        ) : isError ? (
          <p className="text-sm text-slate-400">Failed to load data.</p>
        ) : total === 0 ? (
          <p className="text-sm text-slate-400">No tasks found.</p>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={3}
                dataKey="value"
                animationBegin={0}
                animationDuration={600}
              >
                {data.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={entry.color}
                    stroke="white"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend content={<CustomLegend />} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Centre label when loaded */}
      {!loading && !isError && total > 0 && (
        <p className="mt-2 text-center text-[11px] text-slate-400">
          {data.find((d) => d.name === "Completed")?.value ?? 0} of {total} completed
        </p>
      )}
    </motion.div>
  );
}