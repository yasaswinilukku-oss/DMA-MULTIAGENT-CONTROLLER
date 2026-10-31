"""DMA service: every transfer is a REAL Icarus Verilog simulation of hardware/rtl.

The backend keeps one 'controller session'. start() launches the compiled testbench with the
configured SRC/DST/COUNT, parses the FSM trace and result, cross-checks the hardware outcome
against the independent spec (bots/common/spec.py) and the memory dump, and appends the run
to reports/dma_history.json (used by /api/analytics and the dashboard).
"""
from __future__ import annotations

import json
import tempfile
import threading
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional

from bots.common import sim, spec
from bots.common.paths import REPORTS_DIR, RTL_DIR, SIM_DIR, TB_FILE, ROOT
from bots.common.verilog_parser import parse_fsm
from bots.testing.testing_bot import read_hex

HISTORY_FILE = REPORTS_DIR / "dma_history.json"
LAST_VCD = SIM_DIR / "dma_last_transfer.vcd"
API_BINARY = SIM_DIR / "dma_api.vvp"
MAX_HISTORY = 500
DEFAULT_CONFIG = {"src": 0, "dst": 128, "count": 16}


class SimulationUnavailable(RuntimeError):
    pass


class DmaService:
    def __init__(self) -> None:
        self._lock = threading.RLock()
        self.config: Dict[str, int] = dict(DEFAULT_CONFIG)
        self.state = "IDLE"            # IDLE | DONE | ERROR
        self.last_result: Optional[Dict] = None
        self._fsm = parse_fsm(RTL_DIR / "dma_fsm.v")
        self._state_names = {v: k[2:] for k, v in self._fsm.states.items()}

    # -------------------------------------------------------------- build --
    def _ensure_binary(self) -> None:
        tools = sim.tools_available()
        if not tools["iverilog"] or not tools["vvp"]:
            raise SimulationUnavailable("Icarus Verilog (iverilog/vvp) is not installed on the server")
        sources = list(RTL_DIR.glob("*.v")) + [TB_FILE]
        newest = max(p.stat().st_mtime for p in sources)
        if not API_BINARY.exists() or API_BINARY.stat().st_mtime < newest:
            ok, log = sim.compile_design(out=API_BINARY)
            if not ok:
                raise SimulationUnavailable(f"Verilog compilation failed: {log[-400:]}")

    # ------------------------------------------------------------ history --
    def _history(self) -> List[Dict]:
        try:
            return json.loads(HISTORY_FILE.read_text())
        except Exception:  # noqa: BLE001
            return []

    def _append_history(self, rec: Dict) -> None:
        h = self._history()
        h.append(rec)
        REPORTS_DIR.mkdir(exist_ok=True)
        HISTORY_FILE.write_text(json.dumps(h[-MAX_HISTORY:], indent=1))

    def history(self) -> List[Dict]:
        return self._history()

    # ------------------------------------------------------------- public --
    def set_config(self, src: int, dst: int, count: int) -> Dict:
        with self._lock:
            self.config = {"src": src, "dst": dst, "count": count}
            self.state = "IDLE"
            return self.status()

    def status(self) -> Dict:
        h = self._history()
        ok = sum(1 for r in h if r["success"])
        return {"state": self.state, "config": dict(self.config), "last_result": self.last_result,
                "totals": {"transfers": len(h), "successful": ok, "failed": len(h) - ok},
                "simulator": sim.tools_available()["iverilog"] is not None,
                "memory_words": spec.MEM_DEPTH}

    def reset(self) -> Dict:
        """Return the controller session to IDLE with default configuration."""
        with self._lock:
            self.config = dict(DEFAULT_CONFIG)
            self.state = "IDLE"
            self.last_result = None
            return self.status()

    def start(self) -> Dict:
        with self._lock:
            self._ensure_binary()
            c = self.config
            expected = spec.expected_error(c["src"], c["dst"], c["count"])
            with tempfile.TemporaryDirectory(prefix="dma_api_") as tmp:
                dump = Path(tmp) / "dump.hex"
                t0 = time.perf_counter()
                r = sim.run_sim([f"+MODE=normal", f"+SRC={c['src']}", f"+DST={c['dst']}", f"+CNT={c['count']}",
                                 f"+EXPERR={expected}", "+TRACE", f"+DUMP={dump}", f"+VCD={LAST_VCD}"],
                                binary=API_BINARY, timeout=60)
                wall_ms = round((time.perf_counter() - t0) * 1000, 1)
                res = r.get("result")
                if not r["ok"] or not res:
                    raise RuntimeError(r.get("error") or "simulation produced no result")
                words = read_hex(dump) if dump.exists() else []
            hw_err = res.get("err_code", 0)
            done, error = res.get("done") == 1, res.get("error") == 1
            verified = None
            src_preview, dst_preview = [], []
            if words and done:
                s, d, n = c["src"], c["dst"], c["count"]
                verified = words[d:d + n] == words[s:s + n]
                src_preview = [f"{w:08x}" for w in words[s:s + min(n, 8)]]
                dst_preview = [f"{w:08x}" for w in words[d:d + min(n, 8)]]
            trace = [{"cycle": t["cycle"], "state": self._state_names.get(t["state"], str(t["state"])),
                      "remaining": t["remaining"]} for t in r["state_trace"] if t["state"] in self._state_names]
            success = bool(done and not error and verified and res.get("status") == "PASS")
            consistent = hw_err == expected
            outcome = {
                "success": success, "state": "DONE" if done else "ERROR" if error else "UNKNOWN",
                "hardware_error_code": hw_err, "spec_expected_error": expected,
                "hardware_matches_spec": consistent, "cycles": res.get("cycles"),
                "words_requested": c["count"], "words_moved": c["count"] if done else 0,
                "data_verified": verified, "testbench_status": res.get("status"),
                "testbench_failures": r["failures"], "fsm_trace": trace,
                "source_preview": src_preview, "destination_preview": dst_preview,
                "config": dict(c), "wall_time_ms": wall_ms,
                "timestamp_utc": datetime.now(timezone.utc).isoformat(timespec="seconds"),
                "vcd": str(LAST_VCD.relative_to(ROOT)),
            }
            # a configuration the spec says is invalid counts as a *correctly handled* error,
            # but it is still a failed transfer from the user's point of view
            self.state = outcome["state"] if outcome["state"] in ("DONE", "ERROR") else "IDLE"
            self.last_result = outcome
            self._append_history({k: outcome[k] for k in ("timestamp_utc", "config", "success", "cycles",
                                                         "hardware_error_code", "words_moved", "state")})
            return outcome


SERVICE = DmaService()
