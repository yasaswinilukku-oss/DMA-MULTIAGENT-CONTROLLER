# Multi-Agent Intelligent DMA Controller
Computer Organization & Architecture project: a **Verilog DMA controller** simulated with Icarus Verilog, driven and
verified by **four automation bots**, a **FastAPI** backend and a **React/Vite/TypeScript/Tailwind/Recharts** dashboard.

> The four bots are deterministic automation scripts, **not** autonomous LLM agents. The only optional LLM use is
> the Training Bot's `ask` command (needs `ANTHROPIC_API_KEY`; works without it).

## The four bots
| ID | Bot | What it really does | Run |
|---|---|---|---|
| testing | Testing Bot | compiles RTL, runs 29 simulations, double-checks memory with Python, writes reports | `python bots/testing/testing_bot.py` |
| documentation | Documentation Bot | parses the RTL and generates architecture/FSM/module docs + README block | `python bots/documentation/documentation_bot.py` |
| training | Training Bot | tutor CLI: topics, quizzes, viva, code + waveform explanations | `python bots/training/training_bot.py` |
| frontend | Frontend Bot | builds/verifies the dashboard, checks API wiring, launches it | `python bots/frontend/frontend_bot.py` |

`bots/orchestrator.py` registers exactly these four, runs one or all, stores status/timestamps in
`reports/bot_status.json`, and catches bot crashes. Per-bot docs: [docs/bots/](docs/bots/).

## Install
```bash
sudo apt-get install -y iverilog          # macOS: brew install icarus-verilog
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cd frontend && npm install && cd ..       # Node 18+
```

## Run
```bash
python run_project.py                     # menu: 1 simulate ... 6 all bots ... 9 exit
python bots/orchestrator.py run-all       # testing -> documentation -> training -> frontend
python bots/orchestrator.py status
python bots/frontend/frontend_bot.py --serve   # dashboard + API at http://localhost:8000
python -m pytest tests -q                 # 12 tests incl. bug-injection tests
```

## Demonstration script (for the viva)
1. `python run_project.py --choice 1` - real simulation, writes `hardware/simulation/dma_waves.vcd` (open in GTKWave).
2. `python bots/testing/testing_bot.py` - 29 tests; open `reports/test_report.md`.
3. `python -m pytest tests/test_testing_bot_detects_bugs.py -v` - shows the bot catching injected RTL bugs.
4. `python bots/documentation/documentation_bot.py` - then open `docs/fsm_diagram.md`.
5. `python bots/training/training_bot.py` - try Quiz and "Explain the waveform".
6. `python bots/frontend/frontend_bot.py --serve` - open the dashboard: start a 32-word transfer, then try
   src=0, dst=4, count=16 (hardware reports overlap error 4), run each bot from the "Four Bots" tab.

## Hardware summary
`hardware/rtl/`: `dma_controller.v` (top), `dma_fsm.v`, `dma_registers.v`, `memory_model.v`, `io_device.v`.
Testbench: `hardware/testbench/dma_tb.v` (self-checking, plusarg driven). Register map, FSM, error codes and
timing are documented in `docs/` (generated). Measured: **4 cycles per word + 4 cycles overhead**.

## REST API (FastAPI, docs at /docs)
`GET /api/status` `GET /api/bots` `POST /api/bots/{id}/run` `GET /api/reports` `GET /api/dma/status`
`POST /api/dma/config` `POST /api/dma/start` `POST /api/dma/reset` `GET /api/analytics`
`GET /api/training/topics` `POST /api/training/quiz`.
Every DMA start runs the real Verilog simulation. There is no shell access: bots come from a fixed registry,
inputs are range-validated integers, report names are whitelisted.

## Honest limitations
* Memory-to-memory copy with a DREQ/DACK handshake, single channel; no CPU bus arbiter, no scatter-gather.
* Overlapping source/destination is rejected (error 4) instead of being handled like `memmove`.
* The dashboard's FSM animation replays the real trace returned by the simulation; it is not a live cycle stream.
* "CPU cycles saved" on the Analytics tab uses an assumed programmed-I/O cost (12 cycles/word); it is labelled as an assumption.
* The dashboard was built, type-checked and API-tested, but I did not test it in a real browser session.
* The optional LLM path of the Training Bot is untested. Verilog was only simulated, never synthesised on an FPGA.

## Generated documentation
<!-- DOC-BOT:START -->
_Auto-maintained by the Documentation Bot - last run 2026-10-30 17:03 UTC._

| RTL module | File | Ports | Sub-modules |
|---|---|---|---|
| `dma_controller` | `hardware/rtl/dma_controller.v` | 20 | dma_fsm, dma_registers |
| `dma_fsm` | `hardware/rtl/dma_fsm.v` | 18 | - |
| `dma_registers` | `hardware/rtl/dma_registers.v` | 23 | - |
| `io_device` | `hardware/rtl/io_device.v` | 7 | - |
| `memory_model` | `hardware/rtl/memory_model.v` | 10 | - |

FSM: 9 states (IDLE, REQ, GRANT, READ, LATCH, WRITE, UPDATE, DONE, ERROR), 12 transitions. Details: [docs/fsm_diagram.md](docs/fsm_diagram.md), [docs/architecture.md](docs/architecture.md), [docs/dma_working.md](docs/dma_working.md), [docs/module_documentation.md](docs/module_documentation.md).

Latest Testing Bot run: **PASS** - 29/29 tests passed (see `reports/test_report.md`).
<!-- DOC-BOT:END -->
