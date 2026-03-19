import client from "../client";

// ─── ERPNext field list for Task ──────────────────────────────────────────────
const TASK_FIELDS = [
  "name",
  "subject",
  "project",
  "status",
  "priority",
  "exp_start_date",
  "exp_end_date",
  "progress",
  "creation",
  "modified",
  "owner"
].join(",");

// ─── getTasks ─────────────────────────────────────────────────────────────────
/**
 * Fetch tasks, optionally filtered by project.
 *
 * @param {Object}  params
 * @param {string}  [params.projectId]
 * @param {string}  [params.status]      - "Open" | "Working" | "Pending Review" | "Completed" | "Cancelled"
 * @param {string}  [params.assignedTo]  - User email / ID
 * @param {string}  [params.priority]    - "Low" | "Medium" | "High" | "Urgent"
 * @param {string}  [params.search]      - Searches subject
 * @param {number}  [params.limit=100]
 * @param {number}  [params.offset=0]
 * @param {string}  [params.orderBy]
 * @returns {Promise<{ data: Task[], total_count: number }>}
 */
export async function getTasks({
  projectId,
  status,
  assignedTo,
  priority,
  search,
  limit = 100,
  offset = 0,
  orderBy = "modified desc",
} = {}) {
  const filters = [];

  if (projectId)  filters.push(["project",     "=",    projectId]);
  if (status)     filters.push(["status",      "=",    status]);
  if (assignedTo) filters.push(["assigned_to", "=",    assignedTo]);
  if (priority)   filters.push(["priority",    "=",    priority]);
  if (search)     filters.push(["subject",     "like", `%${search}%`]);

  const { data } = await client.get("/api/resource/Task", {
    params: {
      fields: `["${TASK_FIELDS.split(",").join('","')}"]`,
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

// ─── getTask ──────────────────────────────────────────────────────────────────
/**
 * Fetch a single task by its `name` (ERPNext document ID).
 *
 * @param {string} taskId
 * @returns {Promise<Task>}
 */
export async function getTask(taskId) {
  const { data } = await client.get(
    `/api/resource/Task/${encodeURIComponent(taskId)}`
  );
  return data.data;
}

// ─── createTask ───────────────────────────────────────────────────────────────
/**
 * Create a new task.
 *
 * @param {Partial<Task>} payload
 * @returns {Promise<Task>}
 */
export async function createTask(payload) {
  const { data } = await client.post("/api/resource/Task", payload);
  return data.data;
}

// ─── updateTask ───────────────────────────────────────────────────────────────
/**
 * Update an existing task (full or partial payload).
 *
 * @param {string} taskId
 * @param {Partial<Task>} payload
 * @returns {Promise<Task>}
 */
export async function updateTask(taskId, payload) {
  const { data } = await client.put(
    `/api/resource/Task/${encodeURIComponent(taskId)}`,
    payload
  );
  return data.data;
}

// ─── updateTaskStatus ─────────────────────────────────────────────────────────
/**
 * Convenience wrapper — update only the status of a task.
 * Useful for Kanban drag-and-drop.
 *
 * @param {string} taskId
 * @param {string} status  - "Open" | "Working" | "Pending Review" | "Completed" | "Cancelled"
 * @returns {Promise<Task>}
 */
export async function updateTaskStatus(taskId, status) {
  return updateTask(taskId, { status });
}

// ─── deleteTask ───────────────────────────────────────────────────────────────
/**
 * Delete a task by its `name`.
 *
 * @param {string} taskId
 * @returns {Promise<{ message: string }>}
 */
export async function deleteTask(taskId) {
  const { data } = await client.delete(
    `/api/resource/Task/${encodeURIComponent(taskId)}`
  );
  return data;
}