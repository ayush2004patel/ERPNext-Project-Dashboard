import { useState, useCallback } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { cn } from "@/lib/utils";

// ─── MobileOverlay ────────────────────────────────────────────────────────────
function MobileOverlay({ visible, onClick }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClick}
          className="fixed inset-0 z-20 bg-black/40 backdrop-blur-sm lg:hidden"
          aria-hidden="true"
        />
      )}
    </AnimatePresence>
  );
}

// ─── PageTransition ───────────────────────────────────────────────────────────
function PageTransition({ children }) {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        className="flex min-h-full flex-col"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

// ─── AppShell ─────────────────────────────────────────────────────────────────
export default function AppShell() {
  // Desktop: sidebar can be collapsed to icon-only mode
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);
  // Mobile: sidebar slides in as a drawer
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleDesktop = useCallback(() => setDesktopCollapsed((v) => !v), []);
  const toggleMobile  = useCallback(() => setMobileOpen((v) => !v), []);
  const closeMobile   = useCallback(() => setMobileOpen(false), []);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans antialiased">

      {/* ── Desktop Sidebar ── */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <Sidebar collapsed={desktopCollapsed} onToggle={toggleDesktop} />
      </div>

      {/* ── Mobile Sidebar Drawer ── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            key="mobile-sidebar"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-y-0 left-0 z-30 flex lg:hidden"
          >
            <Sidebar collapsed={false} onToggle={closeMobile} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Mobile Overlay ── */}
      <MobileOverlay visible={mobileOpen} onClick={closeMobile} />

      {/* ── Main Column ── */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">

        {/* Topbar */}
        <Topbar onSidebarToggle={toggleMobile} />

        {/* Scrollable content area */}
        <main
          id="main-content"
          className={cn(
            "flex-1 overflow-y-auto overflow-x-hidden",
            "bg-slate-50"
          )}
        >
          {/* Inner container with consistent padding */}
          <div className="mx-auto w-full max-w-screen-2xl px-4 py-6 sm:px-6 lg:px-8">
            <PageTransition>
              <Outlet />
            </PageTransition>
          </div>
        </main>
      </div>
    </div>
  );
}