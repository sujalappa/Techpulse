import type { Checkpoint, Digest, RunState, Subscriber } from "./types";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!response.ok) {
    throw new Error(await response.text());
  }
  return response.json() as Promise<T>;
}

export function createRun() {
  return request<{ run: RunState; checkpoint: Checkpoint }>("/run", { method: "POST" });
}

export function listRuns() {
  return request<{ runs: RunState[] }>("/runs");
}

export function getCurrentCheckpoint() {
  return request<{ checkpoint: Checkpoint | null }>("/checkpoint/current");
}

export function approveCheckpoint(checkpointId: string, selectedItemIds?: string[]) {
  return request<{ run: RunState; checkpoint: Checkpoint | null }>(`/checkpoint/${checkpointId}/approve`, {
    method: "POST",
    body: JSON.stringify({ selected_item_ids: selectedItemIds }),
  });
}

export function listDigests() {
  return request<{ digests: Digest[] }>("/digests");
}

export function listPublicDigests() {
  return request<{ digests: Digest[] }>("/public/digests");
}

export function subscribe(payload: {
  email: string;
  name?: string;
  topics: string[];
  frequency: "weekly";
}) {
  const token = localStorage.getItem("techpulse_token");
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return request<{ subscriber: Subscriber; token: string }>("/public/subscribe", {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
}

export function loginSubscriber(email: string) {
  return request<{ subscriber: Subscriber; token: string }>("/public/login", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}
