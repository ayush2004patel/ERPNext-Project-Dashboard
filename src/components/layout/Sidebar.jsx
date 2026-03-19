import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  FolderKanban,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Zap,
  Settings,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Nav items ────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  {
    label: "Dashboard",
    to: "/",
    icon: LayoutDashboard,
    end: true,
  },
  {
    label: "Projects",
    to: "/projects",
    icon: FolderKanban,
  },
  {
    label: "Analytics",
    to: "/analytics",
    icon: BarChart3,
  },
];

const BOTTOM_ITEMS = [
  { label: "Settings",    to: "/settings", icon: Settings },
  { label: "Help",        to: "/help",     icon: HelpCircle },
];

// ─── NavItem ──────────────────────────────────────────────────────────────────
function NavItem({ item, collapsed }) {
  const Icon = item.icon;

  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        cn(
          "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium",
          "transition-all duration-150 ease-out",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
          isActive
            ? "bg-indigo-500/15 text-indigo-400"
            : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
        )
      }
    >
      {({ isActive }) => (
        <>
          {/* Active pill indicator */}
          {isActive && (
            <motion.span
              layoutId="sidebar-active-pill"
              className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-indigo-400"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}

          <Icon
            size={18}
            className={cn(
              "shrink-0 transition-colors duration-150",
              isActive ? "text-indigo-400" : "text-slate-500 group-hover:text-slate-300"
            )}
          />

          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.span
                key="label"
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="overflow-hidden whitespace-nowrap"
              >
                {item.label}
              </motion.span>
            )}
          </AnimatePresence>

          {/* Tooltip when collapsed */}
          {collapsed && (
            <span
              className={cn(
                "pointer-events-none absolute left-full z-50 ml-3 rounded-md",
                "bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-slate-200",
                "opacity-0 shadow-lg ring-1 ring-white/10",
                "transition-opacity duration-150 group-hover:opacity-100",
                "whitespace-nowrap"
              )}
            >
              {item.label}
            </span>
          )}
        </>
      )}
    </NavLink>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
export default function Sidebar({ collapsed, onToggle }) {
  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 240 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={cn(
        "relative z-30 flex h-full flex-col overflow-hidden",
        "border-r border-white/5 bg-[#0F172A]"
      )}
      style={{ minWidth: collapsed ? 64 : 240 }}
    >
      {/* ── Logo / Brand ── */}
      <div className="flex h-16 shrink-0 items-center gap-3 border-b border-white/5 px-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500/20 ring-1 ring-indigo-500/30">
          <Zap size={16} className="text-indigo-400" />
        </div>

        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.div
              key="brand-text"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.18 }}
              className="overflow-hidden"
            >
              <p className="whitespace-nowrap font-display text-sm font-semibold leading-tight text-white">
                ERP Smart
              </p>
              <p className="whitespace-nowrap text-[10px] font-medium uppercase tracking-widest text-slate-500">
                Project Hub
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Primary Nav ── */}
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto overflow-x-hidden px-3 py-4">
        <p className={cn(
          "mb-2 px-1 text-[10px] font-semibold uppercase tracking-widest text-slate-600",
          "transition-opacity duration-200",
          collapsed ? "opacity-0" : "opacity-100"
        )}>
          Navigation
        </p>

        {NAV_ITEMS.map((item) => (
          <NavItem key={item.to} item={item} collapsed={collapsed} />
        ))}
      </nav>

      {/* ── Bottom Nav ── */}
      <div className="shrink-0 border-t border-white/5 px-3 py-3">
        <div className="flex flex-col gap-1">
          {BOTTOM_ITEMS.map((item) => (
            <NavItem key={item.to} item={item} collapsed={collapsed} />
          ))}
        </div>
      </div>

      {/* ── Collapse Toggle ── */}
      <button
        onClick={onToggle}
        className={cn(
          "absolute -right-3 top-[72px] z-40",
          "flex h-6 w-6 items-center justify-center rounded-full",
          "border border-slate-700 bg-[#0F172A] text-slate-400",
          "shadow-md transition-colors duration-150 hover:border-indigo-500 hover:text-indigo-400",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        )}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </motion.aside>
  );
}