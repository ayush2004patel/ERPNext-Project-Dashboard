import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, FolderKanban, Calendar, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCreateProject } from "@/hooks/useProjects";
import { useUpdateProject } from "@/hooks/useProjects";

// ─── Field components ─────────────────────────────────────────────────────────
function Label({ htmlFor, children, required }) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-xs font-semibold uppercase tracking-wider text-slate-500"
    >
      {children}
      {required && <span className="ml-0.5 text-rose-400">*</span>}
    </label>
  );
}

function Input({ id, className, ...props }) {
  return (
    <input
      id={id}
      className={cn(
        "w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5",
        "text-sm text-slate-800 placeholder-slate-400",
        "transition-colors duration-150",
        "focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}

function Select({ id, children, className, ...props }) {
  return (
    <select
      id={id}
      className={cn(
        "w-full appearance-none rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5",
        "text-sm text-slate-800",
        "transition-colors duration-150",
        "focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}

function FieldGroup({ children }) {
  return <div className="flex flex-col gap-2">{children}</div>;
}

function ErrorText({ children }) {
  return children ? (
    <p className="text-[11px] font-medium text-rose-500">{children}</p>
  ) : null;
}

// ─── Empty form state ─────────────────────────────────────────────────────────
const EMPTY = {
  project_name:       "",
  status:             "Open",
  expected_end_date:  "",
};

function validate(form) {
  const errors = {};
  if (!form.project_name.trim())
    errors.project_name = "Project name is required.";
  return errors;
}

// ─── ProjectFormModal ─────────────────────────────────────────────────────────
/**
 * @param {Object}   props
 * @param {boolean}  props.open
 * @param {Function} props.onClose
 * @param {Object}   [props.project]   - If provided, modal is in "edit" mode
 */
export default function ProjectFormModal({ open, onClose, project }) {
  const isEdit = Boolean(project);

  const [form,   setForm]   = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");

  const { mutate: createProject, isPending: creating } = useCreateProject({
    onSuccess: () => { onClose(); },
    onError:   (err) => setServerError(err.message ?? "Failed to create project."),
  });

  const { mutate: updateProject, isPending: updating } = useUpdateProject({
    onSuccess: () => { onClose(); },
    onError:   (err) => setServerError(err.message ?? "Failed to update project."),
  });

  const isPending = creating || updating;

  // Seed form when editing
  useEffect(() => {
    if (open) {
      setServerError("");
      setErrors({});
      setForm(
        isEdit
          ? {
              project_name:      project.project_name ?? "",
              status:            project.status       ?? "Open",
              expected_end_date: project.expected_end_date ?? "",
            }
          : EMPTY
      );
    }
  }, [open, project, isEdit]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
    if (serverError)  setServerError("");
  }

  function handleSubmit(e) {
    e.preventDefault();
    const validationErrors = validate(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const payload = {
      project_name:      form.project_name.trim(),
      status:            form.status,
      ...(form.expected_end_date && { expected_end_date: form.expected_end_date }),
    };

    if (isEdit) {
      updateProject({ projectId: project.name, payload });
    } else {
      createProject(payload);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* ── Backdrop ── */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            aria-hidden="true"
          />

          {/* ── Panel ── */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              key="panel"
              role="dialog"
              aria-modal="true"
              aria-labelledby="modal-title"
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className={cn(
                "relative w-full max-w-md overflow-hidden",
                "rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/20"
              )}
            >
              {/* Accent stripe */}
              <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-400" />

              {/* Header */}
              <div className="flex items-center justify-between px-6 pb-0 pt-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50">
                    <FolderKanban size={17} className="text-indigo-500" />
                  </div>
                  <div>
                    <h2
                      id="modal-title"
                      className="font-display text-base font-semibold text-slate-800"
                    >
                      {isEdit ? "Edit Project" : "New Project"}
                    </h2>
                    <p className="text-[11px] text-slate-400">
                      {isEdit
                        ? "Update the project details below."
                        : "Fill in the details to create a new ERPNext project."}
                    </p>
                  </div>
                </div>

                <button
                  onClick={onClose}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-lg",
                    "text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                  )}
                  aria-label="Close modal"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} noValidate>
                <div className="flex flex-col gap-5 px-6 py-6">

                  {/* Server error */}
                  <AnimatePresence>
                    {serverError && (
                      <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        className="rounded-lg border border-rose-100 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-600"
                      >
                        {serverError}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Project Name */}
                  <FieldGroup>
                    <Label htmlFor="project_name" required>
                      Project Name
                    </Label>
                    <div className="relative">
                      <Input
                        id="project_name"
                        name="project_name"
                        value={form.project_name}
                        onChange={handleChange}
                        placeholder="e.g. Website Redesign Q3"
                        disabled={isPending}
                        className={errors.project_name ? "border-rose-300 focus:border-rose-400 focus:ring-rose-500/20" : ""}
                      />
                    </div>
                    <ErrorText>{errors.project_name}</ErrorText>
                  </FieldGroup>

                  {/* Status */}
                  <FieldGroup>
                    <Label htmlFor="status">
                      <span className="flex items-center gap-1.5">
                        <Tag size={11} />
                        Status
                      </span>
                    </Label>
                    <Select
                      id="status"
                      name="status"
                      value={form.status}
                      onChange={handleChange}
                      disabled={isPending}
                    >
                      <option value="Open">Open</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </Select>
                  </FieldGroup>

                  {/* Expected End Date */}
                  <FieldGroup>
                    <Label htmlFor="expected_end_date">
                      <span className="flex items-center gap-1.5">
                        <Calendar size={11} />
                        Expected End Date
                      </span>
                    </Label>
                    <Input
                      id="expected_end_date"
                      name="expected_end_date"
                      type="date"
                      value={form.expected_end_date}
                      onChange={handleChange}
                      disabled={isPending}
                    />
                  </FieldGroup>
                </div>

                {/* Footer actions */}
                <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 px-6 py-4">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isPending}
                    className={cn(
                      "rounded-lg px-4 py-2 text-sm font-medium text-slate-600",
                      "border border-slate-200 bg-white transition-colors",
                      "hover:bg-slate-50 hover:text-slate-800",
                      "disabled:cursor-not-allowed disabled:opacity-50",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                    )}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isPending}
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-5 py-2",
                      "bg-indigo-500 text-sm font-semibold text-white shadow-sm",
                      "transition-all hover:bg-indigo-600 active:scale-[0.98]",
                      "disabled:cursor-not-allowed disabled:opacity-60",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                    )}
                  >
                    {isPending && <Loader2 size={14} className="animate-spin" />}
                    {isPending
                      ? isEdit ? "Saving…" : "Creating…"
                      : isEdit ? "Save Changes" : "Create Project"
                    }
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}