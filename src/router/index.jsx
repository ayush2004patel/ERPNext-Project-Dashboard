import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

import { queryClient } from "@/lib/queryClient";
import AppShell from "@/components/layout/AppShell";

// ─── Page imports ─────────────────────────────────────────────────────────────
// Swap these stubs for your real feature pages as you build them out.
// The stub file lives at src/pages/index.jsx — replace each export there with
// the real component when it's ready, and the router will automatically pick it up.
import DashboardPage from "@/features/dashboard/DashboardPage";
import ProjectsPage from "@/features/projects/ProjectsPage";
import ProjectBoardPage from "@/features/tasks/ProjectBoardPage";
import AnalyticsPage from "@/features/analytics/AnalyticsPage";
import { NotFoundPage } from "@/pages";

// ─── Route definitions ────────────────────────────────────────────────────────
const router = createBrowserRouter([
  {
    // AppShell is the persistent root layout — Sidebar + Topbar + <Outlet />
    path: "/",
    element: <AppShell />,
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: "projects",
        children: [
          {
            index: true,
            element: <ProjectsPage />,
          },
          {
            path: ":id",
            element: <ProjectBoardPage />,
          },
        ],
      },
      {
        path: "analytics",
        element: <AnalyticsPage />,
      },
      {
        // Catch-all 404
        path: "*",
        element: <NotFoundPage />,
      },
    ],
  },
]);

// ─── AppRouter ────────────────────────────────────────────────────────────────
/**
 * Top-level component that composes all providers.
 * Mount this once in src/main.jsx:
 *
 *   import AppRouter from "@/router";
 *   ReactDOM.createRoot(document.getElementById("root")).render(<AppRouter />);
 */
export default function AppRouter() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />

      {/* Dev tools: only renders in development mode */}
      {import.meta.env.DEV && (
        <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-right" />
      )}
    </QueryClientProvider>
  );
}