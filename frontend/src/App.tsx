import { useState } from "react";
import Overview from "./pages/Overview";
import Simulator from "./pages/Simulator";
import Bots from "./pages/Bots";
import Analytics from "./pages/Analytics";
import Learning from "./pages/Learning";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "simulator", label: "DMA Simulator" },
  { id: "bots", label: "Four Bots" },
  { id: "analytics", label: "Analytics" },
  { id: "learning", label: "Learning Center" },
] as const;
type Tab = (typeof TABS)[number]["id"];

export default function App() {
  const [tab, setTab] = useState<Tab>("overview");
  // Pages stay mounted-on-demand; each one loads its own data from the FastAPI backend.
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/70 px-6 py-4">
        <h1 className="text-xl font-bold">Multi-Agent Intelligent DMA Controller</h1>
        <p className="text-xs text-slate-400">Verilog hardware simulated with Icarus Verilog - four automation bots - live dashboard</p>
        <nav className="mt-3 flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium ${tab === t.id ? "bg-indigo-600 text-white" : "text-slate-300 hover:bg-slate-800"}`}>
              {t.label}
            </button>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl p-6">
        {tab === "overview" && <Overview />}
        {tab === "simulator" && <Simulator />}
        {tab === "bots" && <Bots />}
        {tab === "analytics" && <Analytics />}
        {tab === "learning" && <Learning />}
      </main>
    </div>
  );
}
