# Proposed extra chart (not edited in source yet)

**Idea:** **CPU occupancy vs DMA occupancy over time**

A stacked area (or two-line) chart with time / transfer index on X and cycle share on Y:

- Red: CPU busy doing programmed-I/O style copies (`word_count × 12`)
- Green: DMA busy (`4 × word_count + 4`)
- Grey: CPU idle / free during the DMA burst

This would sit next to “CPU cycles saved” and answer the viva question: “When DMA is running, what is the CPU doing?” Answer: it is free; occupancy drops to setup only.

I am not changing `frontend/` or `backend/` in this PR. If the team agrees, this chart can be added to `Analytics.tsx` later.
