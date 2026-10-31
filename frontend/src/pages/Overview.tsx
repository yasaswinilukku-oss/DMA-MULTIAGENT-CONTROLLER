import { useCallback, useEffect, useState } from "react";
import { api } from "../api";
import type { Status } from "../types";
import { Card, ErrorBanner, Stat, btnGhost } from "../components/ui";

export default function Overview() {
  const [s, setS] = useState<Status | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const load = useCallback(() => api.status().then(setS).catch((e: Error) => setErr(`Backend unreachable - start it with "python run_project.py" (option 5). ${e.message}`)), []);
  useEffect(() => { void load(); }, [load]);

  return (
    <div>
      <ErrorBanner message={err} onClose={() => setErr(null)} />
      {s && (
        <>
          <Card title="Project" right={<button className={btnGhost} onClick={() => void load()}>Refresh</button>}>
            <div className="text-lg font-semibold">{s.project} <span className="text-xs text-slate-500">v{s.version}</span></div>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-300">
              <span>DMA controller status:</span>
              <span className={`rounded-full px-3 py-0.5 text-xs font-bold ${s.dma.state === "ERROR" ? "bg-rose-500/20 text-rose-300" : s.dma.state === "DONE" ? "bg-emerald-500/20 text-emerald-300" : "bg-slate-700 text-slate-200"}`}>{s.dma.state}</span>
              <span className="text-xs text-slate-500">simulator: {s.toolchain.iverilog}</span>
            </div>
          </Card>
          <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
            <Stat label="Total transfers" value={s.totals.transfers} hint="real Verilog simulations run via the API" />
            <Stat label="Successful" value={s.totals.successful} tone="good" />
            <Stat label="Failed" value={s.totals.failed} tone={s.totals.failed ? "bad" : "default"} hint="includes correctly rejected invalid configs" />
            <Stat label="Active bots" value={`${s.bots.active}/${s.bots.registered}`} hint={`${s.bots.healthy} with a successful last run`} />
          </div>
        </>
      )}
    </div>
  );
}
