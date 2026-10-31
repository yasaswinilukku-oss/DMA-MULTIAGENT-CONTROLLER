import type { ReactNode } from "react";

export function Card({ title, children, right }: { title?: string; children: ReactNode; right?: ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900 p-5 shadow">
      {(title || right) && (
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">{title}</h2>
          {right}
        </div>
      )}
      {children}
    </section>
  );
}

export function Stat({ label, value, tone = "default", hint }: { label: string; value: ReactNode; tone?: "default" | "good" | "bad"; hint?: string }) {
  const color = tone === "good" ? "text-emerald-400" : tone === "bad" ? "text-rose-400" : "text-slate-100";
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className={`mt-1 text-3xl font-bold ${color}`}>{value}</div>
      {hint && <div className="mt-1 text-xs text-slate-500">{hint}</div>}
    </div>
  );
}

export function Badge({ status }: { status: string }) {
  const map: Record<string, string> = {
    success: "bg-emerald-500/20 text-emerald-300", running: "bg-amber-500/20 text-amber-300",
    failed: "bg-rose-500/20 text-rose-300", error: "bg-rose-500/20 text-rose-300",
    "never run": "bg-slate-700/60 text-slate-300",
  };
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${map[status] ?? "bg-slate-700 text-slate-200"}`}>{status}</span>;
}

export function ErrorBanner({ message, onClose }: { message: string | null; onClose?: () => void }) {
  if (!message) return null;
  return (
    <div className="mb-4 flex items-start justify-between rounded-lg border border-rose-700 bg-rose-950 px-4 py-3 text-sm text-rose-200">
      <span>{message}</span>
      {onClose && <button className="ml-4 text-rose-300 hover:text-white" onClick={onClose}>dismiss</button>}
    </div>
  );
}

export const btn = "rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50";
export const btnGhost = "rounded-lg border border-slate-600 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800 disabled:opacity-50";
export const input = "w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 focus:border-indigo-500 focus:outline-none";
