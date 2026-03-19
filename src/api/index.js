// ─── API Layer — Central Export ───────────────────────────────────────────────
// Import from this file anywhere in the app:
//   import { getProjects, createTask, uploadFile } from "@/api"

export { default as client } from "./client";

export * from "./endpoints/projects";
export * from "./endpoints/tasks";
