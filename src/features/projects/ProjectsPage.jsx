import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  X,
  FolderOpen,
  AlertTriangle,
  Loader2,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useProjects }      from "@/hooks/useProjects";
import { useDeleteProject } from "@/hooks/useProjects";
import ProjectCard      from "./components/ProjectCard";
import ProjectFormModal from "./components/ProjectFormModal";

// ─── Status options ────────────────────────────────────────────────────────────
const STATUS_OPTIONS = [
  { value: "",           label: "All Statuses" },
  { value: "Open",       label: "Open"         },
  { value: "Completed",  label: "Completed"    },
  { value: "Cancelled",  label: "Cancelled"    },
];

// ─── Skeleton grid ─────────────────────────────────────────────────────────────
function ProjectCardSkeleton() {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-2">
          <div className="h-4 w-3/4 animate-pulse rounded-full bg-slate-200" />
          <div className="h-3 w-1/2 animate-pulse rounded-full bg-slate-100" />
        </div>
        <div className="h-5 w-16 animate-pulse rounded-full bg-slate-100" />
      </div>
      <div className="space-y-1.5">
        <div className="flex justify-between">
          <div className="h-3 w-12 animate-pulse rounded-full bg-slate-100" />
          <div className="h-3 w-8 animate-pulse rounded-full bg-slate-100" />
        </div>
        <div className="h-1.5 w-full animate-pulse rounded-full bg-slate-100" />
      </div>
      <div className="flex items-center justify-between">
        <div className="h-3 w-24 animate-pulse rounded-full bg-slate-100" />
        <div className="h-6 w-6 animate-pulse rounded-full bg-slate-100" />
      </div>
    </div>
  );
}

// ─── EmptyState ───────────────────────────────────────────────────────────────
function EmptyState({ filtered, onReset, onCreate }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="col-span-full flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-slate-200 bg-white py-20 text-center"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
        <FolderOpen size={24} className="text-slate-400" />
      </div>
      <div>
        <p className="font-display text-sm font-semibold text-slate-700">
          {filtered ? "No matching projects" : "No projects yet"}
        </p>
        <p className="mt-1 text-xs text-slate-400">
          {filtered
            ? "Try adjusting your search or filter."
            : "Create your first project to get started."}
        </p>
      </div>
      {filtered ? (
        <button
          onClick={onReset}
          className="text-xs font-medium text-indigo-500 hover:text-indigo-600"
        >
          Clear filters
        </button>
      ) : (
        <button
          onClick={onCreate}
          className={cn(
            "flex items-center gap-1.5 rounded-lg bg-indigo-500 px-4 py-2",
            "text-xs font-semibold text-white hover:bg-indigo-600"
          )}
        >
          <Plus size={13} /> New Project
        </button>
      )}
    </motion.div>
  );
}

// ─── DeleteConfirmModal ───────────────────────────────────────────────────────
function DeleteConfirmModal({ project, onConfirm, onCancel, isPending }) {
  return (
    <AnimatePresence>
      {project && (
        <>
          <motion.div
            key="del-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              key="del-panel"
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.18 }}
              className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50">
                <AlertTriangle size={20} className="text-rose-500" />
              </div>
              <h3 className="font-display text-base font-semibold text-slate-800">
                Delete Project?
              </h3>
              <p className="mt-1.5 text-sm text-slate-500">
                <strong className="text-slate-700">
                  {project.project_name || project.name}
                </strong>{" "}
                will be permanently deleted. This action cannot be undone.
              </p>
              <div className="mt-5 flex items-center justify-end gap-2.5">
                <button
                  onClick={onCancel}
                  disabled={isPending}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={onConfirm}
                  disabled={isPending}
                  className="flex items-center gap-2 rounded-lg bg-rose-500 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-600 disabled:opacity-60"
                >
                  {isPending && <Loader2 size={13} className="animate-spin" />}
                  {isPending ? "Deleting…" : "Delete"}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── ProjectsPage ─────────────────────────────────────────────────────────────
export default function ProjectsPage() {
  const [search,        setSearch]        = useState("");
  const [statusFilter,  setStatusFilter]  = useState("");
  const [modalOpen,     setModalOpen]     = useState(false);
  const [editProject,   setEditProject]   = useState(null);   // project to edit
  const [deleteTarget,  setDeleteTarget]  = useState(null);   // project to delete

  // Fetch all projects (client-side filter for instant search UX)
  const {
    data:      projectsData,
    isPending: loading,
    isError,
    error,
  } = useProjects({ limit: 200 });

  const { mutate: deleteProject, isPending: deleting } = useDeleteProject({
    onSuccess: () => setDeleteTarget(null),
  });

  const allProjects = projectsData?.data ?? [];

  // ── Client-side filtering ──────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = allProjects;
    if (statusFilter)
      list = list.filter((p) => p.status === statusFilter);
    if (search.trim())
      list = list.filter((p) =>
        (p.project_name || p.name)
          .toLowerCase()
          .includes(search.toLowerCase())
      );
    return list;
  }, [allProjects, search, statusFilter]);

  const isFiltered = Boolean(search || statusFilter);

  const handleOpenCreate = useCallback(() => {
    setEditProject(null);
    setModalOpen(true);
  }, []);

  const handleOpenEdit = useCallback((project) => {
    setEditProject(project);
    setModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setModalOpen(false);
    setEditProject(null);
  }, []);

  const handleReset = useCallback(() => {
    setSearch("");
    setStatusFilter("");
  }, []);

  return (
    <div className="flex flex-col gap-6">

      {/* ── Page header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Projects</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            {loading
              ? "Loading projects…"
              : `${allProjects.length} project${allProjects.length !== 1 ? "s" : ""} total`}
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className={cn(
            "flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-2.5",
            "text-sm font-semibold text-white shadow-sm shadow-indigo-200",
            "transition-all hover:bg-indigo-600 active:scale-[0.98]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
          )}
        >
          <Plus size={16} />
          New Project
        </button>
      </div>

      {/* ── Error banner ── */}
      {isError && (
        <div className="flex items-center gap-3 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <AlertTriangle size={15} className="shrink-0 text-rose-400" />
          {error?.message ?? "Failed to load projects."}
        </div>
      )}

      {/* ── Filters bar ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search
            size={14}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects…"
            className={cn(
              "w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-9",
              "text-sm text-slate-800 placeholder-slate-400 shadow-sm",
              "transition-colors focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            )}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Status filter */}
        <div className="relative min-w-[160px]">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={cn(
              "w-full appearance-none rounded-xl border border-slate-200 bg-white",
              "py-2.5 pl-3.5 pr-8 text-sm text-slate-700 shadow-sm",
              "transition-colors focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            )}
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <ChevronDown
            size={14}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
        </div>

        {/* Active filter count badge */}
        <AnimatePresence>
          {isFiltered && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={handleReset}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs font-medium text-slate-500 shadow-sm hover:text-slate-700"
            >
              <X size={12} />
              Clear filters
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* ── Results summary ── */}
      {!loading && isFiltered && (
        <p className="text-xs text-slate-400">
          Showing {filtered.length} of {allProjects.length} projects
        </p>
      )}

      {/* ── Grid ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => <ProjectCardSkeleton key={i} />)
          : filtered.length === 0
          ? (
            <EmptyState
              filtered={isFiltered}
              onReset={handleReset}
              onCreate={handleOpenCreate}
            />
          )
          : filtered.map((project, i) => (
            <ProjectCard
              key={project.name}
              project={project}
              index={i}
              onEdit={() => handleOpenEdit(project)}
              onDelete={() => setDeleteTarget(project)}
            />
          ))
        }
      </div>

      {/* ── Create / Edit modal ── */}
      <ProjectFormModal
        open={modalOpen}
        onClose={handleCloseModal}
        project={editProject}
      />

      {/* ── Delete confirm modal ── */}
      <DeleteConfirmModal
        project={deleteTarget}
        isPending={deleting}
        onConfirm={() => deleteProject(deleteTarget.name)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}