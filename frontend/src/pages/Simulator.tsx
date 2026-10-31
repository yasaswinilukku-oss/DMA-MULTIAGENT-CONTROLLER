import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../api";
import type { DmaConfig, TransferResult } from "../types";
import FsmDiagram from "../components/FsmDiagram";
import { Card, ErrorBanner, btn, btnGhost, input } from "../components/ui";

const ERR: Record<number, string> = { 0: "none", 1: "zero count", 2: "source out of range", 3: "destination out of range", 4: "source/destination overlap", 5: "DREQ timeout" };

export default function Simulator() {
  const [cfg, setCfg] = useState<DmaConfig>({ src: 0, dst: 128, count: 16 });
  const [result, setResult] = useState<TransferResult | null>(null);
  const [fsm, setFsm] = useState<string | null>("IDLE");
  const [remaining, setRemaining] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const timer = useRef<number | null>(null);

  const stopReplay = () => { if (timer.current) window.clearTimeout(timer.current); timer.current = null; };
  useEffect(() => {
    void api.dmaStatus().then((s) => { setCfg(s.config); if (s.last_result) setResult(s.last_result); }).catch((e: Error) => setErr(e.message));
    return stopReplay;
  }, []);

  // Replay the REAL FSM trace returned by the Verilog simulation, one state change at a time.
  const replay = useCallback((r: TransferResult) => {
    stopReplay();
    const steps = r.fsm_trace.filter((t) => t.state !== "IDLE" || t.cycle > r.fsm_trace[0].cycle);
    let i = 0;
    const tick = () => {
      if (i >= steps.length) { setFsm(r.state === "ERROR" ? "ERROR" : "IDLE"); setBusy(false); return; }
      setFsm(steps[i].state); setRemaining(steps[i].remaining); i += 1;
      timer.current = window.setTimeout(tick, 90);
    };
    setBusy(true); tick();
  }, []);

  const start = async () => {
    setErr(null); setBusy(true);
    try {
      await api.dmaConfig(cfg);
      const r = await api.dmaStart();
      setResult(r); setRemaining(r.words_requested);
      replay(r);
    } catch (e) { setErr((e as Error).message); setBusy(false); }
  };
  const reset = async () => {
    stopReplay(); setErr(null);
    try { const s = await api.dmaReset(); setCfg(s.config); setResult(null); setFsm("IDLE"); setRemaining(null); setBusy(false); }
    catch (e) { setErr((e as Error).message); }
  };

  const set = (k: keyof DmaConfig) => (e: React.ChangeEvent<HTMLInputElement>) => setCfg({ ...cfg, [k]: Number(e.target.value) });
  const done = result ? result.words_moved : 0;
  const left = remaining ?? 0;
  const pct = result ? (result.state === "DONE" ? Math.round(((result.words_requested - left) / Math.max(1, result.words_requested)) * 100) : 0) : 0;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="lg:col-span-2"><ErrorBanner message={err} onClose={() => setErr(null)} /></div>
      <Card title="Configuration">
        <div className="grid grid-cols-3 gap-3">
          <label className="text-xs text-slate-400">Source address<input type="number" min={0} max={65535} className={input} value={cfg.src} onChange={set("src")} /></label>
          <label className="text-xs text-slate-400">Destination address<input type="number" min={0} max={65535} className={input} value={cfg.dst} onChange={set("dst")} /></label>
          <label className="text-xs text-slate-400">Transfer size (words)<input type="number" min={0} max={65535} className={input} value={cfg.count} onChange={set("count")} /></label>
        </div>
        <p className="mt-2 text-xs text-slate-500">Memory is 256 words. Invalid values are sent to the real hardware, which must detect and report them.</p>
        <div className="mt-4 flex gap-3">
          <button className={btn} disabled={busy} onClick={() => void start()}>Start transfer</button>
          <button className={btnGhost} onClick={() => void reset()}>Reset</button>
        </div>
      </Card>
      <Card title="Live FSM (replay of the simulated trace)">
        <FsmDiagram current={fsm} />
        <div className="mt-4 text-sm text-slate-300">Current state: <b>{fsm ?? "-"}</b> | words remaining: <b>{remaining ?? "-"}</b></div>
        <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-slate-800">
          <div className="h-full bg-indigo-500 transition-all" style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-1 text-xs text-slate-500">Transfer progress: {pct}%</div>
      </Card>
      {result && (
        <Card title="Transfer result (from the Verilog simulation)">
          <div className={`mb-3 inline-block rounded-full px-3 py-1 text-sm font-bold ${result.success ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"}`}>
            {result.success ? "COMPLETED - data verified" : `NOT COMPLETED - ${ERR[result.hardware_error_code] ?? "error"}`}
          </div>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            <dt className="text-slate-500">Final state</dt><dd>{result.state}</dd>
            <dt className="text-slate-500">Words moved</dt><dd>{done} / {result.words_requested}</dd>
            <dt className="text-slate-500">Clock cycles</dt><dd>{result.cycles}</dd>
            <dt className="text-slate-500">Hardware error code</dt><dd>{result.hardware_error_code} ({ERR[result.hardware_error_code]})</dd>
            <dt className="text-slate-500">Spec says</dt><dd>{result.spec_expected_error} - {result.hardware_matches_spec ? "hardware agrees" : "MISMATCH"}</dd>
            <dt className="text-slate-500">Data verified</dt><dd>{result.data_verified === null ? "n/a" : String(result.data_verified)}</dd>
            <dt className="text-slate-500">Waveform</dt><dd className="truncate">{result.vcd}</dd>
          </dl>
        </Card>
      )}
      {result && result.source_preview.length > 0 && (
        <Card title="Memory preview (first 8 words)">
          <table className="w-full text-left font-mono text-xs">
            <thead className="text-slate-500"><tr><th>#</th><th>source</th><th>destination</th></tr></thead>
            <tbody>{result.source_preview.map((w, i) => (
              <tr key={i}><td>{i}</td><td>{w}</td><td className={result.destination_preview[i] === w ? "text-emerald-400" : "text-rose-400"}>{result.destination_preview[i]}</td></tr>
            ))}</tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
