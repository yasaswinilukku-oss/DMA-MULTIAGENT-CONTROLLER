const STATES = ["IDLE", "REQ", "GRANT", "READ", "LATCH", "WRITE", "UPDATE", "DONE", "ERROR"];

/** Row of FSM states; the one the simulated hardware is currently in is highlighted. */
export default function FsmDiagram({ current }: { current: string | null }) {
  return (
    <div className="flex flex-wrap gap-2">
      {STATES.map((s) => {
        const active = s === current;
        const base = s === "ERROR" ? "border-rose-700" : s === "DONE" ? "border-emerald-700" : "border-slate-700";
        return (
          <div key={s} className={`rounded-lg border px-3 py-2 text-xs font-bold transition ${base} ${
            active ? "scale-110 bg-indigo-600 text-white shadow-lg shadow-indigo-900" : "bg-slate-950 text-slate-400"}`}>
            {s}
          </div>
        );
      })}
    </div>
  );
}
