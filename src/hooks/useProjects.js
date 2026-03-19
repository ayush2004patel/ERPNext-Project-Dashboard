import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
} from "@/api";

// ─── Query Keys ───────────────────────────────────────────────────────────────
export const projectKeys = {
  all:    ()           => ["projects"],
  lists:  ()           => ["projects", "list"],
  list:   (filters)    => ["projects", "list", filters],
  detail: (projectId)  => ["projects", "detail", projectId],
};

// ─── useProjects ──────────────────────────────────────────────────────────────
/**
 * Fetch a filtered/paginated list of projects.
 *
 * @param {Object}  filters
 * @param {string}  [filters.status]
 * @param {string}  [filters.search]
 * @param {number}  [filters.limit]
 * @param {number}  [filters.offset]
 * @param {string}  [filters.orderBy]
 * @param {Object}  [queryOptions]   - Extra TanStack Query options
 */
export function useProjects(filters = {}, queryOptions = {}) {
  return useQuery({
    queryKey: projectKeys.list(filters),
    queryFn:  () => getProjects(filters),
    staleTime: 1000 * 60 * 3, // 3 minutes
    ...queryOptions,
  });
}

// ─── useProject ───────────────────────────────────────────────────────────────
/**
 * Fetch a single project by ID.
 *
 * @param {string} projectId
 * @param {Object} [queryOptions]
 */
export function useProject(projectId, queryOptions = {}) {
  return useQuery({
    queryKey: projectKeys.detail(projectId),
    queryFn:  () => getProject(projectId),
    enabled:  Boolean(projectId),
    refetchInterval: 5000,
    staleTime: 1000 * 60 * 3,
    ...queryOptions,
  });
}

// ─── useCreateProject ─────────────────────────────────────────────────────────
export function useCreateProject(mutationOptions = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => createProject(payload),
    onSuccess: (newProject) => {
      // Invalidate all project lists so they refetch
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      // Optionally seed the detail cache immediately
      queryClient.setQueryData(projectKeys.detail(newProject.name), newProject);
    },
    ...mutationOptions,
  });
}

// ─── useUpdateProject ─────────────────────────────────────────────────────────
export function useUpdateProject(mutationOptions = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, payload }) => updateProject(projectId, payload),
    onSuccess: (updatedProject) => {
      // Update the detail cache in-place
      queryClient.setQueryData(
        projectKeys.detail(updatedProject.name),
        updatedProject
      );
      // Invalidate lists so summaries stay fresh
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
    },
    ...mutationOptions,
  });
}

// ─── useDeleteProject ─────────────────────────────────────────────────────────
export function useDeleteProject(mutationOptions = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (projectId) => deleteProject(projectId),
    onSuccess: (_, projectId) => {
      queryClient.removeQueries({ queryKey: projectKeys.detail(projectId) });
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
    },
    ...mutationOptions,
  });
}