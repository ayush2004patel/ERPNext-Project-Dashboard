import { useState, useRef, useEffect } from "react";
import { useLocation, useMatches, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  Search,
  Bell,
  ChevronRight,
  X,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Route label map ──────────────────────────────────────────────────────────
const ROUTE_LABELS = {
  "/":           "Dashboard",
  "/projects":   "Projects",
  "/analytics":  "Analytics",
  "/settings":   "Settings",
  "/help":       "Help",
};

function useBreadcrumbs() {
  const location = useLocation();
  const segments = location.pathname.split("/").filter(Boolean);

  if (segments.length === 0) return [{ label: "Dashboard", to: "/" }];

  const crumbs = [{ label: "Dashboard", to: "/" }];

  let path = "";
  for (const seg of segments) {
    path += `/${seg}`;
    const label = ROUTE_LABELS[path] ?? seg.replace(/-/g, " ");
    crumbs.push({ label, to: path });
  }

  return crumbs;
}

// ─── GlobalSearch ─────────────────────────────────────────────────────────────
function GlobalSearch() {
  const [open, setOpen]   = useState(false);
  const [query, setQuery] = useState("");
  const inputRef          = useRef(null);

  // Cmd/Ctrl + K to focus
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <div className="relative">
      {/* Collapsed pill */}
      <button
        onClick={() => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 50); }}
        className={cn(
          "flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2",
          "text-sm text-slate-400 shadow-sm transition-all duration-150",
          "hover:border-indigo-300 hover:shadow-indigo-100/50",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
          open ? "hidden" : "flex"
        )}
      >
        <Search size={14} />
        <span className="hidden sm:inline">Search anything…</span>
        <kbd className="hidden rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-mono text-slate-400 sm:inline">
          ⌘K
        </kbd>
      </button>

      {/* Expanded input */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, width: 140, scale: 0.97 }}
            animate={{ opacity: 1, width: 280, scale: 1 }}
            exit={{ opacity: 0, width: 140, scale: 0.97 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="flex items-center gap-2 rounded-lg border border-indigo-300 bg-white px-3 py-2 shadow-lg shadow-indigo-100/50 ring-2 ring-indigo-500/20"
          >
            <Search size={14} className="shrink-0 text-indigo-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search projects, tasks…"
              className="min-w-0 flex-1 bg-transparent text-sm text-slate-700 placeholder-slate-400 outline-none"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="shrink-0 rounded p-0.5 text-slate-400 hover:text-slate-600"
              >
                <X size={12} />
              </button>
            )}
            <button
              onClick={() => { setOpen(false); setQuery(""); }}
              className="shrink-0 rounded p-0.5 text-slate-400 hover:text-slate-600"
            >
              <kbd className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-mono">
                Esc
              </kbd>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── UserAvatar ───────────────────────────────────────────────────────────────
function UserAvatar() {
  const { data: user, isPending } = useCurrentUser();

  const initials = user?.full_name
    ? user.full_name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : "U";

  const avatarUrl = user?.user_image;

  return (
    <div className="flex items-center gap-3">
      <button
        className={cn(
          "relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          "bg-gradient-to-br from-indigo-400 to-violet-500 text-xs font-semibold text-white",
          "ring-2 ring-white shadow-sm transition-all duration-150",
          "hover:ring-indigo-300 focus-visible:outline-none focus-visible:ring-indigo-500"
        )}
        aria-label="User menu"
      >
        {isPending ? (
          <Loader2 size={12} className="animate-spin" />
        ) : avatarUrl ? (
          <img
            src={avatarUrl}
            alt={user?.full_name}
            className="h-full w-full rounded-full object-cover"
          />
        ) : (
          <span>{initials}</span>
        )}
      </button>

      {user?.full_name && (
        <div className="hidden flex-col lg:flex">
          <span className="text-xs font-semibold leading-tight text-slate-700">
            {user.full_name}
          </span>
          <span className="text-[10px] text-slate-400">{user.email}</span>
        </div>
      )}
    </div>
  );
}

// ─── Topbar ───────────────────────────────────────────────────────────────────
export default function Topbar({ onSidebarToggle }) {
  const breadcrumbs = useBreadcrumbs();

  return (
    <header
      className={cn(
        "flex h-16 shrink-0 items-center justify-between gap-4",
        "border-b border-slate-200/80 bg-white/80 px-4 backdrop-blur-sm",
        "sm:px-6"
      )}
    >
      {/* ── Left: Toggle + Breadcrumbs ── */}
      <div className="flex min-w-0 items-center gap-3">
        <button
          onClick={onSidebarToggle}
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
            "text-slate-400 transition-colors duration-150",
            "hover:bg-slate-100 hover:text-slate-700",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
            "lg:hidden"
          )}
          aria-label="Toggle sidebar"
        >
          <Menu size={18} />
        </button>

        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1">
          {breadcrumbs.map((crumb, i) => {
            const isLast = i === breadcrumbs.length - 1;
            return (
              <span key={crumb.to} className="flex items-center gap-1">
                {i > 0 && (
                  <ChevronRight size={13} className="shrink-0 text-slate-300" />
                )}
                {isLast ? (
                  <span className="truncate font-display text-sm font-semibold text-slate-800">
                    {crumb.label}
                  </span>
                ) : (
                  <Link
                    to={crumb.to}
                    className={cn(
                      "truncate text-sm text-slate-400 transition-colors",
                      "hover:text-indigo-500",
                      i === 0 && breadcrumbs.length > 1 ? "hidden sm:inline" : ""
                    )}
                  >
                    {crumb.label}
                  </Link>
                )}
              </span>
            );
          })}
        </nav>
      </div>

      {/* ── Right: Search + Notifications + User ── */}
      <div className="flex shrink-0 items-center gap-3">
        <GlobalSearch />

        {/* Notifications bell */}
        <button
          className={cn(
            "relative flex h-8 w-8 items-center justify-center rounded-lg",
            "text-slate-400 transition-colors duration-150",
            "hover:bg-slate-100 hover:text-slate-700",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          )}
          aria-label="Notifications"
        >
          {/* <Bell size={16} /> */}
          {/* Unread dot */}
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-indigo-500 ring-1 ring-white" />
        </button>

        <div className="h-5 w-px bg-slate-200" />

        {/* <UserAvatar /> */}
      </div>
    </header>
  );
}