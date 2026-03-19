import client from "../client";

// ─── ERPNext field list for Project ──────────────────────────────────────────
const PROJECT_FIELDS = [
  "name",
  "project_name",
  "status",
  "percent_complete",
  "expected_start_date",
  "expected_end_date",
  "actual_start_date",
  "actual_end_date",
  "project_type",
  "priority",
  "department",
  "notes",
  "is_active",
  "company",
  "customer",
  "estimated_costing",
  "total_costing_amount",
  "creation",
  "modified",
  "owner",
].join(",");

// ─── getProjects ──────────────────────────────────────────────────────────────
/**
 * Fetch a paginated, optionally filtered list of projects.
 *
 * @param {Object} params
 * @param {number}  [params.limit=20]
 * @param {number}  [params.offset=0]
 * @param {string}  [params.status]        - "Open" | "Completed" | "Cancelled"
 * @param {string}  [params.search]        - Searches project_name
 * @param {string}  [params.orderBy]       - Field to order by, e.g. "modified desc"
 * @returns {Promise<{ data: Project[], total_count: number }>}
 */
export async function getProjects({
  limit = 20,
  offset = 0,
  status,
  search,
  orderBy = "modified desc",
} = {}) {
  const filters = [];

  if (status) filters.push(["status", "=", status]);
  if (search) filters.push(["project_name", "like", `%${search}%`]);

  const { data } = await client.get("/api/resource/Project", {
    params: {
      fields: `["${PROJECT_FIELDS.split(",").join('","')}"]`,
      filters: filters.length ? JSON.stringify(filters) : undefined,
      limit_page_length: limit,
      limit_start: offset,
      order_by: orderBy,
    },
  });

  return {
    data: data.data ?? [],
    total_count: data.total_count ?? data.data?.length ?? 0,
  };
}

// ─── getProject ───────────────────────────────────────────────────────────────
/**
 * Fetch a single project by its `name` (ERPNext document ID).
 *
 * @param {string} projectId
 * @returns {Promise<Project>}
 */
export async function getProject(projectId) {
  const { data } = await client.get(
    `/api/resource/Project/${encodeURIComponent(projectId)}`
  );
  return data.data;
}

// ─── createProject ────────────────────────────────────────────────────────────
/**
 * Create a new project.
 *
 * @param {Partial<Project>} payload
 * @returns {Promise<Project>}
 */
export async function createProject(payload) {
  const { data } = await client.post("/api/resource/Project", payload);
  return data.data;
}

// ─── updateProject ────────────────────────────────────────────────────────────
/**
 * Update an existing project.
 *
 * @param {string} projectId
 * @param {Partial<Project>} payload
 * @returns {Promise<Project>}
 */
export async function updateProject(projectId, payload) {
  const { data } = await client.put(
    `/api/resource/Project/${encodeURIComponent(projectId)}`,
    payload
  );
  return data.data;
}

// ─── deleteProject ────────────────────────────────────────────────────────────
/**
 * Delete a project by its `name`.
 *
 * @param {string} projectId
 * @returns {Promise<{ message: string }>}
 */
export async function deleteProject(projectId) {
  const { data } = await client.delete(
    `/api/resource/Project/${encodeURIComponent(projectId)}`
  );
  return data;
}