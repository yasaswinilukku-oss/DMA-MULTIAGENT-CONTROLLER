import { useCallback, useEffect, useState } from "react";
import { api } from "../api";
import type { Bot } from "../types";
import { Badge, Card, ErrorBanner, btn, btnGhost } from "../components/ui";

export default function Bots() {
  const [bots, setBots] = useState<Bot[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [report, setReport] = useState<{ name: string; text: string } | null>(null);

  const load = useCallback(() => api.bots().then(setBots).catch((e: Error) => setErr(e.message)), []);
  useEffect(() => { void load(); }, [load]);

  const run = async (id: string) => {
    setBusy(id); setErr(null);
    try { await api.runBot(id); } catch (e) { setErr((e as Error).message); }
    setBusy(null); void load();
  };
  const open = async (name: string) => {
    try { setReport({ name, text: await api.report(name) }); } catch (e) { setErr((e as Error).message); }
  };

  return (
    <div>
      <ErrorBanner message={err} onClose={() => setErr(null)} />
      <p className="mb-4 text-sm text-slate-400">Exactly four <b>automation bots</b> (deterministic scripts - not autonomous LLM agents). The Run buttons call <code>POST /api/bots/&#123;id&#125;/run</code>.</p>
      <div className="grid gap-4 md:grid-cols-2">
        {bots.map((b) => (
          <Card key={b.id} title={b.name} right={<Badge status={busy === b.id ? "running" : b.status} />}>
            <p className="text-sm text-slate-300">{b.responsibility}</p>
            <p className="mt-1 text-xs text-slate-500">{b.kind} - <code>{b.entry_point}</code></p>
            <dl className="mt-3 text-sm">
              <div className="flex justify-between"><dt className="text-slate-500">Last execution</dt><dd>{b.last_run ? new Date(b.last_run).toLocaleString() : "never"}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Duration</dt><dd>{b.duration_s ?? "-"} s</dd></div>
              <div className="mt-1 text-slate-300">{b.summary ?? "No report yet - press Run."}</div>
              {b.error && b.status !== "success" && <pre className="mt-2 max-h-24 overflow-auto rounded bg-rose-950 p-2 text-xs text-rose-200">{b.error}</pre>}
            </dl>
            <div className="mt-3 flex flex-wrap gap-2">
              <button className={btn} disabled={busy !== null} onClick={() => void run(b.id)}>{busy === b.id ? "Running..." : "Run"}</button>
              {b.report_files.map((f) => <button key={f} className={btnGhost} onClick={() => void open(f)}>{f}</button>)}
            </div>
          </Card>
        ))}
      </div>
      {report && (
        <Card title={`Latest report: ${report.name}`} right={<button className={btnGhost} onClick={() => setReport(null)}>close</button>}>
          <pre className="max-h-96 overflow-auto whitespace-pre-wrap text-xs text-slate-300">{report.text}</pre>
        </Card>
      )}
    </div>
  );
}
