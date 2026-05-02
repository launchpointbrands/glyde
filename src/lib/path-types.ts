// Types and pure helpers for the Advisor path. Lives in its own module
// because `path.ts` is `"use server"` and can only export async actions.

export type PathPriority = "high" | "medium" | "low";
export type PathStatus = "todo" | "inprogress" | "done";

export type PathItem = {
  key: string;
  priority: PathPriority;
  headline: string;
  moduleTag: string;
  status: PathStatus;
};

const STATUS_ORDER: PathStatus[] = ["todo", "inprogress", "done"];

export function nextStatus(s: PathStatus): PathStatus {
  const i = STATUS_ORDER.indexOf(s);
  return STATUS_ORDER[(i + 1) % STATUS_ORDER.length];
}
