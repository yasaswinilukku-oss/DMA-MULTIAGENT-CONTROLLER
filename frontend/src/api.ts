import type { Analytics, Bot, DmaConfig, DmaStatus, Question, ReportInfo, Status, Topic, TransferResult, VivaItem } from "./types";

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, { headers: { "Content-Type": "application/json" }, ...init });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = typeof body.detail === "string" ? body.detail : JSON.stringify(body.detail);
    } catch { /* keep statusText */ }
    throw new Error(`${res.status}: ${detail}`);
  }
  const ct = res.headers.get("content-type") ?? "";
  return (ct.includes("json") ? res.json() : res.text()) as Promise<T>;
}
const post = <T,>(path: string, body?: unknown) =>
  call<T>(path, { method: "POST", body: body === undefined ? undefined : JSON.stringify(body) });

export const api = {
  status: () => call<Status>("/api/status"),
  bots: () => call<Bot[]>("/api/bots"),
  runBot: (id: string) => post<{ bot_id: string; status: string; summary: string }>(`/api/bots/${id}/run`),
  reports: () => call<ReportInfo[]>("/api/reports"),
  report: (name: string) => call<string>(`/api/reports/${encodeURIComponent(name)}`),
  dmaStatus: () => call<DmaStatus>("/api/dma/status"),
  dmaConfig: (c: DmaConfig) => post<DmaStatus>("/api/dma/config", c),
  dmaStart: () => post<TransferResult>("/api/dma/start"),
  dmaReset: () => post<DmaStatus>("/api/dma/reset"),
  analytics: () => call<Analytics>("/api/analytics"),
  topics: () => call<{ topics: Topic[]; viva: VivaItem[]; modules: { name: string; explanation: string }[] }>("/api/training/topics"),
  quiz: (level: string, count: number) => post<{ level: string; questions: Question[] }>("/api/training/quiz", { level, count }),
};
