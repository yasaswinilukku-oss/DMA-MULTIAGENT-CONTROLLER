# Why we use 12 CPU cycles per word for programmed I/O

**Contributor:** Dada Khalandar  
**Used by:** Analytics “CPU cycles saved” metric

## Programmed I/O (what we compare against)

Without DMA, the CPU copies every word itself. A realistic teaching loop per word looks like this:

1. Read device/memory status (busy / ready) — about **4 cycles**
2. Move one word (load or store the data) — about **4 cycles**
3. Update the pointer / count and branch back to the loop — about **4 cycles**

That is **12 cycles of CPU time per word**. The CPU cannot do other work during this loop. If the device is slow, the CPU also wastes extra cycles polling; we do **not** add that extra wait into the 12, so the estimate is conservative (DMA looks even better in a real busy-wait loop).

## DMA (what our controller does)

After the CPU writes source, destination, and count into the DMA registers and sets “start”:

- The DMA FSM moves the block (request, grant, read, latch, write, update).
- Hardware cost in our design is about **4 cycles per word + 4 cycles of overhead** (see algorithm notes).
- Those cycles belong to the DMA controller and the bus, **not** to the CPU.

The CPU only pays a small **setup** cost (a few register writes), then continues with other instructions.

## Formula used on the Analytics tab

```
PIO_cpu_cycles     = word_count × 12
DMA_cpu_cycles     = setup_cycles          # CPU not in the per-word copy loop
CPU_cycles_saved   = PIO_cpu_cycles − DMA_cpu_cycles
```

Example: copy **16 words**.

- Programmed I/O: `16 × 12 = 192` CPU cycles
- DMA: CPU spends only setup (treat as a few cycles); the 16-word move is hardware
- **CPU cycles saved ≈ 192 − setup**

That single number is what the dashboard reports so the viva can show *why* DMA exists: the same data movement, far less CPU time.
