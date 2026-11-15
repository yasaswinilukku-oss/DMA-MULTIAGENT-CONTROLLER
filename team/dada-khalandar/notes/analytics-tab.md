# What the Analytics tab shows

**Contributor:** Dada Khalandar  
**Role:** DMA Monitoring & Data Visualization  
**Code I own:** `frontend/src/pages/Analytics.tsx`, `backend/services/analytics_service.py`

The Analytics tab is the monitoring screen of our DMA controller project. It does not start a new transfer. It reads completed (and in-progress) transfer records and turns them into charts and numbers so we can compare DMA with programmed I/O.

## Where the data comes from

1. A transfer is programmed through the dashboard (source address, destination address, word count, direction).
2. The backend DMA service runs / records the transfer (cycle count, status, error code if any).
3. `analytics_service.py` collects those records and computes summary metrics.
4. `Analytics.tsx` fetches that payload and draws the charts.

Typical fields per transfer:

| Field | Meaning |
|---|---|
| Transfer ID | Order of the run |
| Source / destination | Memory or I/O addresses used |
| Word count | How many words moved |
| DMA cycles | Cycles the controller actually used |
| CPU cycles saved | Extra CPU work we avoided vs programmed I/O |
| Status | Done / error |

## Charts and panels

- **Transfer history** — each completed transfer as a row or bar (words moved, cycles used, success/fail).
- **Cycle usage** — DMA cycles vs the programmed-I/O estimate for the same word count.
- **CPU cycles saved** — `(word_count × 12) − CPU time still spent on DMA setup`. This uses the 12 cycles/word PIO assumption (see `cpu-cycles-saved.md`).
- **Totals** — total words moved, total DMA cycles, total CPU cycles saved across the session.

The point of this tab is to make the lab result visible: DMA moves the block with a small, predictable cycle cost, while the CPU is free instead of polling and copying every word.
