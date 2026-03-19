import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getTasks,
  getTask,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
} from "@/api";

// ─── Query Keys ───────────────────────────────────────────────────────────────
export const taskKeys = {
  all:       ()          => ["tasks"],
  lists:     ()          => ["tasks", "list"],
  list:      (filters)   => ["tasks", "list", filters],
  byProject: (projectId) => ["tasks", "list", { projectId }],
  detail:    (taskId)    => ["tasks", "detail", taskId],
};

// ─── useTasks ─────────────────────────────────────────────────────────────────
/**
 * Fetch tasks, optionally scoped to a project and/or filtered.
 *
 * @param {Object}  filters
 * @param {string}  [filters.projectId]
 * @param {string}  [filters.status]
 * @param {string}  [filters.assignedTo]
 * @param {string}  [filters.priority]
 * @param {string}  [filters.search]
 * @param {number}  [filters.limit]
 * @param {number}  [filters.offset]
 * @param {Object}  [queryOptions]
 */
export function useTasks(filters = {}, queryOptions = {}) {
  return useQuery({
    queryKey: taskKeys.list(filters),
    queryFn:  () => getTasks(filters),
    refetchInterval: 5000,
    staleTime: 1000 * 60 * 2, // 2 minutes
    ...queryOptions,
  });
}

// ─── useTask ──────────────────────────────────────────────────────────────────
/**
 * Fetch a single task by ID.
 *
 * @param {string} taskId
 * @param {Object} [queryOptions]
 */
export function useTask(taskId, queryOptions = {}) {
  return useQuery({
    queryKey: taskKeys.detail(taskId),
    queryFn:  () => getTask(taskId),
    enabled:  Boolean(taskId),
    staleTime: 1000 * 60 * 2,
    ...queryOptions,
  });
}

// ─── useCreateTask ────────────────────────────────────────────────────────────
export function useCreateTask(mutationOptions = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => createTask(payload),
    onSuccess: (newTask) => {
      // Invalidate all task lists (covers project-scoped and global lists)
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      // Seed detail cache
      queryClient.setQueryData(taskKeys.detail(newTask.name), newTask);
    },
    ...mutationOptions,
  });
}

// ─── useUpdateTask ────────────────────────────────────────────────────────────
export function useUpdateTask(mutationOptions = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, payload }) => updateTask(taskId, payload),
    onSuccess: (updatedTask) => {
      queryClient.setQueryData(taskKeys.detail(updatedTask.name), updatedTask);
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    },
    ...mutationOptions,
  });
}

// ─── useUpdateTaskStatus ──────────────────────────────────────────────────────
/**
 * Optimistically update a task's status — ideal for Kanban drag-and-drop.
 *
 * Usage:
 *   const { mutate } = useUpdateTaskStatus();
 *   mutate({ taskId: "TASK-001", status: "Completed" });
 */
export function useUpdateTaskStatus(mutationOptions = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, status }) => updateTaskStatus(taskId, status),

    // ── Optimistic update ──────────────────────────────────────────────────
    onMutate: async ({ taskId, status }) => {
      // Cancel any in-flight refetches to avoid overwriting our optimistic update
      await queryClient.cancelQueries({ queryKey: taskKeys.detail(taskId) });

      const previousTask = queryClient.getQueryData(taskKeys.detail(taskId));

      // Optimistically patch the detail cache
      if (previousTask) {
        queryClient.setQueryData(taskKeys.detail(taskId), {
          ...previousTask,
          status,
        });
      }

      // Also patch any list caches that contain this task
      queryClient.setQueriesData(
        { queryKey: taskKeys.lists() },
        (oldData) => {
          if (!oldData?.data) return oldData;
          return {
            ...oldData,
            data: oldData.data.map((t) =>
              t.name === taskId ? { ...t, status } : t
            ),
          };
        }
      );

      return { previousTask };
    },

    // ── Rollback on error ──────────────────────────────────────────────────
    onError: (_err, { taskId }, context) => {
      if (context?.previousTask) {
        queryClient.setQueryData(taskKeys.detail(taskId), context.previousTask);
      }
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    },

    onSuccess: (updatedTask) => {
      queryClient.setQueryData(taskKeys.detail(updatedTask.name), updatedTask);
    },

    ...mutationOptions,
  });
}

// ─── useDeleteTask ────────────────────────────────────────────────────────────
export function useDeleteTask(mutationOptions = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId) => deleteTask(taskId),
    onSuccess: (_, taskId) => {
      queryClient.removeQueries({ queryKey: taskKeys.detail(taskId) });
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    },
    ...mutationOptions,
  });
}