"""Analytics derived from real artefacts: dma_history.json (API runs) and test_report.json."""
from __future__ import annotations

import json
from typing import Dict, List

from bots.common.paths import REPORTS_DIR
from .dma_service import SERVICE

# Assumption used ONLY for the programmed-I/O comparison; shown to the user as an assumption.
PIO_CYCLES_PER_WORD_ASSUMPTION = 12


def _test_report() -> Dict:
    try:
        return json.loads((REPORTS_DIR / "test_report.json").read_text())
    except Exception:  # noqa: BLE001
        return {}


def analytics() -> Dict:
    hist = SERVICE.history()
    ok = [h for h in hist if h["success"]]
    rep = _test_report()
    summary = rep.get("summary")
    cm = rep.get("cycle_model") or {}
    sweep = [{"words": n, "cycles": c} for n, c in cm.get("points", [])]
    ran = [{"words": h["words_moved"], "cycles": h["cycles"]} for h in ok if h.get("cycles")]
    cpw = cm.get("cycles_per_word")
    overhead = cm.get("fixed_overhead_cycles")
    perf: Dict = {"available": bool(sweep)}
    if sweep:
        big = max(sweep, key=lambda p: p["words"])
        perf.update({"cycles_per_word": cpw, "fixed_overhead_cycles": overhead,
                     "peak_throughput_words_per_cycle": round(big["words"] / big["cycles"], 4),
                     "measured_at_words": big["words"],
                     "programmed_io_cycles_assumed_per_word": PIO_CYCLES_PER_WORD_ASSUMPTION,
                     "estimated_cpu_cycles_saved_at_max": big["words"] * PIO_CYCLES_PER_WORD_ASSUMPTION - 4,
                     "note": "CPU cycles saved = words x assumed PIO cost - ~4 register writes; the PIO cost is a "
                             "modelling assumption, not a measurement."})
    cats = [{"category": k, "passed": v["passed"], "failed": v["failed"]}
            for k, v in (rep.get("by_category") or {}).items()]
    return {
        "transfer_stats": {"total": len(hist), "successful": len(ok), "failed": len(hist) - len(ok),
                           "avg_cycles": round(sum(h["cycles"] for h in ok if h.get("cycles")) / len(ok), 1) if ok else None,
                           "words_moved": sum(h["words_moved"] for h in ok),
                           "recent": hist[-20:]},
        "test_results": {"available": bool(summary), "summary": summary, "by_category": cats},
        "cycle_analysis": {"test_sweep": sweep, "api_transfers": ran[-30:],
                           "model": {"cycles_per_word": cpw, "overhead": overhead}},
        "performance": perf,
    }
