import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
  Cell,
} from "recharts";
import { motion } from "framer-motion";
// import { Users } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Palette — cycle through these for each user ──────────────────────────────
const BAR_COLORS = [
  "#6366f1", "#8b5cf6", "#06b6d4", "#10b981",
  "#f59e0b", "#f43f5e", "#64748b", "#0ea5e9",
];

// ─── Skeleton ──────────────────────────────────────────────────────────────────
function Skeleton() {
  const rows = [90, 65, 75, 45, 55];
  return (
    <div className="flex flex-col gap-3 py-2">
      {rows.map((w, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="h-3 w-20 animate-pulse rounded-full bg-slate-100" />
          <div
            className="h-5 animate-pulse rounded-md bg-slate-100"
            style={{ width: `${w}%` }}
          />
        </div>
      ))}
    </div>
  );
}

// ─── Custom Tooltip ────────────────────────────────────────────────────────────
function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0].payload;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-lg">
      <p className="text-xs font-semibold text-slate-700">{name}</p>
      <p className="mt-0.5 text-sm font-bold text-slate-900">
        {value} task{value !== 1 ? "s" : ""}
      </p>
    </div>
  );
}

// ─── TasksPerUserChart ─────────────────────────────────────────────────────────
/**
 * @param {Object}   props
 * @param {Array}    props.tasks    - flat task list
 * @param {Array}    props.users    - user list (for display names)
 * @param {boolean}  props.loading
 * @param {boolean}  props.isError
 */
export default function TasksPerUserChart({
  tasks   = [],
  // users   = [],
  loading = false,
  isError = false,
}) {
  // Build email → full_name map for readable labels
  const nameMap = useMemo(() => {
    const m = {};
    for (const u of users) {
      m[u.name]  = u.full_name || u.name;
      m[u.email] = u.full_name || u.email;
    }
    return m;
  }, [users]);

  const data = useMemo(() => {
    const counts = {};
    for (const task of tasks) {
      // Handle _assign (JSON array) or assigned_to (plain string)
      let assignees = [];
      const raw = task._assign ?? task.assigned_to ?? "";
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) assignees = parsed;
        else if (parsed) assignees = [parsed];
      } catch {
        if (raw) assignees = [raw];
      }

      for (const email of assignees) {
        const key = nameMap[email] || email.split("@")[0] || "Unassigned";
        counts[key] = (counts[key] ?? 0) + 1;
      }
    }

    if (Object.keys(counts).length === 0) return [];

    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [tasks, nameMap]);

  const total = data.reduce((s, d) => s + d.value, 0);

  // Dynamic height: ~44px per row, min 200
  const chartHeight = Math.max(200, data.length * 44);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.1 }}
      className="flex flex-col rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      {/* Header */}
      <div className="mb-1 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50">
            <Users size={15} className="text-indigo-500" />
          </div>
          <h2 className="font-display text-sm font-semibold text-slate-800">
            Tasks per User
          </h2>
        </div>
        {!loading && !isError && total > 0 && (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
            {total} assigned
          </span>
        )}
      </div>
      <p className="mb-5 text-xs text-slate-400">
        Distribution of assigned tasks across team members
      </p>

      {/* Chart area */}
      <div style={{ minHeight: 200 }}>
        {loading ? (
          <Skeleton />
        ) : isError ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-slate-400">Failed to load data.</p>
          </div>
        ) : data.length === 0 ? (
          <div className="flex h-48 items-center justify-center">
            <p className="text-sm text-slate-400">No assigned tasks found.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 0, right: 48, left: 8, bottom: 0 }}
              barCategoryGap="28%"
            >
              <CartesianGrid
                horizontal={false}
                strokeDasharray="3 3"
                stroke="#f1f5f9"
              />
              <XAxis
                type="number"
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={90}
                tick={{ fontSize: 11, fill: "#64748b" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) =>
                  v.length > 13 ? v.slice(0, 12) + "…" : v
                }
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: "#f8fafc", radius: 4 }}
              />
              <Bar
                dataKey="value"
                radius={[0, 6, 6, 0]}
                maxBarSize={28}
                animationDuration={500}
              >
                {data.map((entry, i) => (
                  <Cell
                    key={entry.name}
                    fill={BAR_COLORS[i % BAR_COLORS.length]}
                    fillOpacity={0.88}
                  />
                ))}
                <LabelList
                  dataKey="value"
                  position="right"
                  style={{ fontSize: 11, fontWeight: 600, fill: "#64748b" }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </motion.div>
  );
}