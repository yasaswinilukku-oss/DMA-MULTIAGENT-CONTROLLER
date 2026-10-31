export interface Status {
  project: string;
  version: string;
  dma: { state: string; simulator_available: boolean };
  totals: { transfers: number; successful: number; failed: number };
  bots: { registered: number; active: number; running_now: number; healthy: number };
  toolchain: { iverilog: string; node: boolean };
}
export interface Bot {
  id: string; name: string; responsibility: string; kind: string; entry_point: string;
  status: string; last_run: string | null; duration_s: number | null; summary: string | null;
  outputs: string[]; error: string | null; report_files: string[]; runnable: boolean;
}
export interface TraceStep { cycle: number; state: string; remaining: number }
export interface TransferResult {
  success: boolean; state: string; hardware_error_code: number; spec_expected_error: number;
  hardware_matches_spec: boolean; cycles: number; words_requested: number; words_moved: number;
  data_verified: boolean | null; testbench_status: string; testbench_failures: string[];
  fsm_trace: TraceStep[]; source_preview: string[]; destination_preview: string[];
  config: DmaConfig; wall_time_ms: number; timestamp_utc: string; vcd: string;
}
export interface DmaConfig { src: number; dst: number; count: number }
export interface DmaStatus {
  state: string; config: DmaConfig; last_result: TransferResult | null;
  totals: { transfers: number; successful: number; failed: number }; simulator: boolean; memory_words: number;
}
export interface Analytics {
  transfer_stats: { total: number; successful: number; failed: number; avg_cycles: number | null; words_moved: number;
    recent: { timestamp_utc: string; config: DmaConfig; success: boolean; cycles: number | null; hardware_error_code: number }[] };
  test_results: { available: boolean; summary: { total: number; passed: number; failed: number; overall: string } | null;
    by_category: { category: string; passed: number; failed: number }[] };
  cycle_analysis: { test_sweep: { words: number; cycles: number }[]; api_transfers: { words: number; cycles: number }[];
    model: { cycles_per_word: number | null; overhead: number | null } };
  performance: { available: boolean; cycles_per_word?: number; fixed_overhead_cycles?: number;
    peak_throughput_words_per_cycle?: number; measured_at_words?: number;
    programmed_io_cycles_assumed_per_word?: number; estimated_cpu_cycles_saved_at_max?: number; note?: string };
}
export interface ReportInfo { name: string; size: number; modified: string; summary?: unknown; bot?: string }
export interface Topic { id: string; title: string; content: string }
export interface VivaItem { level: string; q: string; a: string }
export interface Question { level: string; question: string; options: string[]; answer_index: number; explanation: string }
