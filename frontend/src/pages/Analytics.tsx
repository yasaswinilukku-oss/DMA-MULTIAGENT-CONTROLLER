import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api } from "../api";
import type { Analytics as A } from "../types";
import { Card, ErrorBanner, Stat } from "../components/ui";

export default function Analytics() {
  const [a, setA] = useState<A | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => { api.analytics().then(setA).catch((e: Error) => setErr(e.message)); }, []);
  if (!a) return <ErrorBanner message={err} />;

  const t = a.transfer_stats, p = a.performance;
  const sweep = a.cycle_analysis.test_sweep.map((x) => ({ words: x.words, "test sweep": x.cycles }));
  const transfers = [{ name: "transfers", successful: t.successful, failed: t.failed }];
  return (
    <div className="space-y-4">
      <ErrorBanner message={err} />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat label="Transfers run" value={t.total} />
        <Stat label="Words moved" value={t.words_moved} />
        <Stat label="Avg cycles / transfer" value={t.avg_cycles ?? "-"} />
        <Stat label="Cycles per word" value={p.cycles_per_word ?? "-"} hint="measured by the Testing Bot" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Transfer statistics">
          <div className="h-64"><ResponsiveContainer><BarChart data={transfers}><CartesianGrid stroke="#1e293b" /><XAxis dataKey="name" stroke="#94a3b8" /><YAxis allowDecimals={false} stroke="#94a3b8" /><Tooltip /><Legend />
            <Bar dataKey="successful" fill="#34d399" /><Bar dataKey="failed" fill="#fb7185" /></BarChart></ResponsiveContainer></div>
        </Card>
        <Card title={a.test_results.summary ? `Test pass / fail (${a.test_results.summary.passed}/${a.test_results.summary.total} passed)` : "Test pass / fail"}>
          {a.test_results.available ? (
            <div className="h-64"><ResponsiveContainer><BarChart data={a.test_results.by_category}><CartesianGrid stroke="#1e293b" /><XAxis dataKey="category" stroke="#94a3b8" fontSize={10} interval={0} angle={-25} textAnchor="end" height={70} /><YAxis allowDecimals={false} stroke="#94a3b8" /><Tooltip /><Legend />
              <Bar dataKey="passed" stackId="a" fill="#34d399" /><Bar dataKey="failed" stackId="a" fill="#fb7185" /></BarChart></ResponsiveContainer></div>
          ) : <p className="text-sm text-slate-400">No test report yet. Run the Testing Bot on the "Four Bots" tab.</p>}
        </Card>
        <Card title="Transfer cycle analysis (cycles vs words)">
          {sweep.length ? (
            <div className="h-64"><ResponsiveContainer><LineChart data={sweep}><CartesianGrid stroke="#1e293b" /><XAxis dataKey="words" stroke="#94a3b8" /><YAxis stroke="#94a3b8" /><Tooltip /><Legend />
              <Line type="monotone" dataKey="test sweep" stroke="#818cf8" strokeWidth={2} dot /></LineChart></ResponsiveContainer></div>
          ) : <p className="text-sm text-slate-400">Run the Testing Bot to measure the cycle model.</p>}
        </Card>
        <Card title="Performance metrics">
          {p.available ? (
            <ul className="space-y-1 text-sm text-slate-300">
              <li>Cycles per word: <b>{p.cycles_per_word}</b> (fixed overhead {p.fixed_overhead_cycles} cycles)</li>
              <li>Throughput at {p.measured_at_words} words: <b>{p.peak_throughput_words_per_cycle}</b> words/cycle</li>
              <li>Estimated CPU cycles saved at {p.measured_at_words} words: <b>{p.estimated_cpu_cycles_saved_at_max}</b></li>
              <li className="text-xs text-slate-500">{p.note}</li>
            </ul>
          ) : <p className="text-sm text-slate-400">No measurements yet.</p>}
        </Card>
      </div>
    </div>
  );
}
