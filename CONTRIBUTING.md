# Contributing

1. Install the prerequisites listed in the README (Icarus Verilog, Python 3.10+, Node 18+).
2. `pip install -r requirements.txt` and `cd frontend && npm install`.
3. Make your change, then run `python -m pytest tests -q` and `python bots/orchestrator.py run-all`.
4. The project has **exactly four bots** (testing, documentation, training, frontend). New
   functionality should extend one of them rather than add a fifth.
5. Never hard-code simulation results: the Testing Bot must always read them from the simulator.
6. Do not commit `frontend/node_modules`, `frontend/dist` or generated `.vcd`/`.vvp` files.
7. If you change RTL, re-run the Documentation Bot so `docs/` and the README block stay in sync.
