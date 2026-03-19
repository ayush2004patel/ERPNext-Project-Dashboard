import { useState, useMemo, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
  defaultDropAnimationSideEffects,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates, arrayMove } from "@dnd-kit/sortable";
import { AnimatePresence } from "framer-motion";
import { useUpdateTaskStatus } from "@/hooks/useTasks";
import KanbanColumn from "./components/KanbanColumn";
import TaskCard     from "./components/TaskCard";

// ─── Column definitions ───────────────────────────────────────────────────────
export const COLUMNS = [
  { id: "Open",           title: "Open"           },
  { id: "Working",        title: "Working"        },
  { id: "Pending Review", title: "Pending Review" },
  { id: "Completed",      title: "Completed"      },
];

const COLUMN_IDS = COLUMNS.map((c) => c.id);

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getTaskColumn(task) {
  return COLUMN_IDS.includes(task.status) ? task.status : "Open";
}

function groupByStatus(tasks) {
  const grouped = Object.fromEntries(COLUMN_IDS.map((id) => [id, []]));
  for (const task of tasks) {
    const col = getTaskColumn(task);
    grouped[col].push(task);
  }
  return grouped;
}

// ─── Drop animation ───────────────────────────────────────────────────────────
const DROP_ANIMATION = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: { active: { opacity: "0.4" } },
  }),
};

// ─── KanbanBoard ──────────────────────────────────────────────────────────────
/**
 * @param {Object}  props
 * @param {Array}   props.tasks     - flat task list from useTasks()
 */
export default function KanbanBoard({ tasks = [] }) {
  const [localTasks,   setLocalTasks]   = useState(null);   // optimistic override
  const [activeDragId, setActiveDragId] = useState(null);

  const { mutate: updateStatus } = useUpdateTaskStatus();

  // Use local (optimistic) tasks when mid-drag; fall back to server tasks
  const displayTasks = localTasks ?? tasks;

  const grouped = useMemo(() => groupByStatus(displayTasks), [displayTasks]);

  const activeTask = useMemo(
    () => displayTasks.find((t) => t.name === activeDragId) ?? null,
    [activeDragId, displayTasks]
  );

  // ── Sensors ─────────────────────────────────────────────────────────────────
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 }, // prevent accidental drags on click
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // ── findContainer ────────────────────────────────────────────────────────────
  // Returns the column id that owns a given draggable id (task name or column id)
  const findContainer = useCallback(
    (id) => {
      if (COLUMN_IDS.includes(id)) return id;
      const task = displayTasks.find((t) => t.name === id);
      return task ? getTaskColumn(task) : null;
    },
    [displayTasks]
  );

  // ── onDragStart ──────────────────────────────────────────────────────────────
  const onDragStart = useCallback(({ active }) => {
    setActiveDragId(active.id);
    // Snapshot current tasks for local mutation
    setLocalTasks((prev) => prev ?? tasks);
  }, [tasks]);

  // ── onDragOver ───────────────────────────────────────────────────────────────
  // Moves the card between columns in local state while dragging (live preview)
  const onDragOver = useCallback(({ active, over }) => {
    if (!over) return;

    const sourceCol = findContainer(active.id);
    const targetCol = findContainer(over.id);

    if (!sourceCol || !targetCol || sourceCol === targetCol) return;

    setLocalTasks((prev) => {
      const current = prev ?? tasks;
      return current.map((t) =>
        t.name === active.id ? { ...t, status: targetCol } : t
      );
    });
  }, [findContainer, tasks]);

  // ── onDragEnd ────────────────────────────────────────────────────────────────
  const onDragEnd = useCallback(({ active, over }) => {
    setActiveDragId(null);

    if (!over) {
      setLocalTasks(null);   // cancel — revert to server state
      return;
    }

    const sourceCol = findContainer(active.id);
    const targetCol = findContainer(over.id);

    if (!sourceCol || !targetCol) {
      setLocalTasks(null);
      return;
    }

    const originalTask = tasks.find((t) => t.name === active.id);
    const didChangeCol = originalTask && originalTask.status !== targetCol;

    if (didChangeCol) {
      // Fire the API mutation; useUpdateTaskStatus handles cache invalidation
      updateStatus(
        { taskId: active.id, status: targetCol },
        {
          onError: () => {
            // Revert optimistic state on failure
            setLocalTasks(null);
          },
          onSuccess: () => {
            // Clear local override — server state is now correct
            setLocalTasks(null);
          },
        }
      );
    } else if (sourceCol === targetCol) {
      // Same-column reorder (cosmetic only — ERPNext doesn't store order)
      setLocalTasks((prev) => {
        const current = prev ?? tasks;
        const colTasks = current.filter((t) => getTaskColumn(t) === sourceCol);
        const otherTasks = current.filter((t) => getTaskColumn(t) !== sourceCol);
        const oldIndex = colTasks.findIndex((t) => t.name === active.id);
        const newIndex = colTasks.findIndex((t) => t.name === over.id);
        if (oldIndex === -1 || newIndex === -1) return current;
        const reordered = arrayMove(colTasks, oldIndex, newIndex);
        return [...otherTasks, ...reordered];
      });
    }
  }, [findContainer, tasks, updateStatus]);

  // ── onDragCancel ─────────────────────────────────────────────────────────────
  const onDragCancel = useCallback(() => {
    setActiveDragId(null);
    setLocalTasks(null);
  }, []);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDragCancel={onDragCancel}
    >
      {/* ── Scrollable column track ── */}
      <div className="flex gap-4 overflow-x-auto pb-4 pt-1">
        {COLUMNS.map((col, i) => (
          <KanbanColumn
            key={col.id}
            id={col.id}
            title={col.title}
            tasks={grouped[col.id]}
            index={i}
          />
        ))}
      </div>

      {/* ── Drag overlay (floating ghost card) ── */}
      <DragOverlay dropAnimation={DROP_ANIMATION}>
        {activeTask ? (
          <div className="rotate-1 opacity-95">
            <TaskCard task={activeTask} isDragging />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}