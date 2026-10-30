#!/usr/bin/env python3
"""Master entry point for the Multi-Agent DMA Controller project.

Interactive menu:      python run_project.py
Non-interactive:       python run_project.py --choice 6        (any menu number)
"""
import argparse
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))

from bots import orchestrator  # noqa: E402
from bots.common import sim  # noqa: E402
from bots.common.paths import REPORTS_DIR, SIM_DIR, VCD_FILE  # noqa: E402

BANNER = """
========================================
 MULTI-AGENT DMA CONTROLLER
========================================

1. Run DMA Simulation
2. Run Testing Bot
3. Run Documentation Bot
4. Run Training Bot
5. Launch Frontend
6. Run All Four Bots
7. View Bot Status
8. View Project Reports
9. Exit

========================================"""


def show(results):
    for r in results:
        print(f"[{r['status'].upper():<7}] {r['bot_id']:<14}{r['duration_s']}s  {r['summary']}")


def dma_simulation() -> None:
    print("Compiling Verilog (iverilog) and simulating a 16-word transfer ...")
    ok, log = sim.compile_design(out=SIM_DIR / "dma_sim.vvp")
    if not ok:
        print("Compilation FAILED:\n" + log); return
    r = sim.run_sim([f"+VCD={VCD_FILE}", "+MODE=normal", "+SRC=0", "+DST=128", "+CNT=16", "+TRACE"],
                    binary=SIM_DIR / "dma_sim.vvp")
    res = r.get("result")
    if not res:
        print("Simulation produced no result:", r.get("error")); return
    print(f"Result: {res['status']}  cycles={res['cycles']}  done={res['done']}  mismatches={res['mismatches']}")
    for f in r["failures"]:
        print("  FAIL:", f)
    print(f"Waveform written to {VCD_FILE.relative_to(ROOT)} (open with: gtkwave {VCD_FILE.relative_to(ROOT)})")


def view_reports() -> None:
    reps = orchestrator.collect_reports()
    for i, r in enumerate(reps, 1):
        print(f"{i:>2}. {r['name']:<28}{r['size']:>8} bytes  {r['modified']}")
    if not reps:
        print("No reports yet - run the bots first."); return
    if sys.stdin.isatty():
        pick = input("Enter a number to print a report (Enter to go back): ").strip()
        if pick.isdigit() and 1 <= int(pick) <= len(reps):
            print((REPORTS_DIR / reps[int(pick) - 1]["name"]).read_text()[:6000])


def handle(choice: str) -> bool:
    if choice == "1": dma_simulation()
    elif choice == "2": show(orchestrator.run_many(["testing"]))
    elif choice == "3": show(orchestrator.run_many(["documentation"]))
    elif choice == "4":
        from bots.training import training_bot
        if sys.stdin.isatty():
            training_bot.menu()
        else:
            show(orchestrator.run_many(["training"]))
    elif choice == "5":
        from bots.frontend import frontend_bot
        frontend_bot.serve()
    elif choice == "6": show(orchestrator.run_all())
    elif choice == "7": orchestrator.print_status()
    elif choice == "8": view_reports()
    elif choice == "9": return False
    else: print("Please choose 1-9.")
    return True


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--choice", help="run one menu item non-interactively")
    a = ap.parse_args()
    if a.choice:
        handle(a.choice); return 0
    while True:
        print(BANNER)
        try:
            c = input("Select an option (1-9): ").strip()
        except (EOFError, KeyboardInterrupt):
            print(); return 0
        if not handle(c):
            return 0


if __name__ == "__main__":
    sys.exit(main())
