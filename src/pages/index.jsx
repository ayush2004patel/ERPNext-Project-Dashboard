// ─── Placeholder pages ────────────────────────────────────────────────────────
// These are lightweight stubs. Replace each with its real implementation as you
// build out the feature modules.

import { Link } from "react-router-dom";
import { LayoutDashboard, FolderKanban, BarChart3, AlertCircle } from "lucide-react";

function PlaceholderPage({ icon: Icon, title, description, children }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 py-20 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/10 ring-1 ring-indigo-500/20">
        <Icon size={28} className="text-indigo-400" />
      </div>
      <div>
        <h1 className="font-display text-2xl font-semibold text-slate-800">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}

export function DashboardPage() {
  return (
    <PlaceholderPage
      icon={LayoutDashboard}
      title="Dashboard"
      description="Your project overview will appear here."
    />
  );
}

export function ProjectsPage() {
  return (
    <PlaceholderPage
      icon={FolderKanban}
      title="Projects"
      description="All your ERPNext projects, listed and filterable."
    />
  );
}

export function ProjectBoardPage() {
  return (
    <PlaceholderPage
      icon={FolderKanban}
      title="Project Board"
      description="Kanban board for tasks within this project."
    >
      <Link
        to="/projects"
        className="mt-2 text-sm font-medium text-indigo-500 hover:text-indigo-600"
      >
        ← Back to Projects
      </Link>
    </PlaceholderPage>
  );
}

export function AnalyticsPage() {
  return (
    <PlaceholderPage
      icon={BarChart3}
      title="Analytics"
      description="Charts and insights across all your projects."
    />
  );
}

export function NotFoundPage() {
  return (
    <PlaceholderPage
      icon={AlertCircle}
      title="404 — Page Not Found"
      description="The page you're looking for doesn't exist."
    >
      <Link
        to="/"
        className="mt-2 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-600"
      >
        Go to Dashboard
      </Link>
    </PlaceholderPage>
  );
}