"""FastAPI backend for the Multi-Agent DMA Controller project.

Run:  uvicorn backend.main:app --port 8000      (or: python run_project.py -> option 5)
No endpoint executes arbitrary commands: bots are looked up in a fixed registry and the
simulator is launched with a fixed executable and a validated, integer-only argument list.
"""
from __future__ import annotations

import json
import re
import shutil
import sys
from pathlib import Path
from typing import Dict, List

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, PlainTextResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from bots import orchestrator
from bots.common import sim
from bots.common.paths import FRONTEND_DIR, REPORTS_DIR
from bots.training import training_bot
from backend.services.analytics_service import analytics
from backend.services.dma_service import SERVICE, SimulationUnavailable

app = FastAPI(title="Multi-Agent DMA Controller API", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
                   allow_methods=["GET", "POST"], allow_headers=["*"])


class DmaConfig(BaseModel):
    src: int = Field(..., ge=0, le=65535, description="source start address")
    dst: int = Field(..., ge=0, le=65535, description="destination start address")
    count: int = Field(..., ge=0, le=65535, description="number of 32-bit words")


class QuizRequest(BaseModel):
    level: str = Field("beginner", pattern="^(beginner|intermediate|advanced)$")
    count: int = Field(5, ge=1, le=20)
    seed: int | None = Field(None, ge=0, le=10**9)


@app.get("/api/status")
def status() -> Dict:
    dma = SERVICE.status()
    bots = orchestrator.list_bots()
    return {"project": "Multi-Agent Intelligent DMA Controller", "version": app.version,
            "dma": {"state": dma["state"], "simulator_available": dma["simulator"]},
            "totals": dma["totals"],
            "bots": {"registered": len(bots), "active": sum(1 for b in bots if b["runnable"]),
                     "running_now": sum(1 for b in bots if b["status"] == "running"),
                     "healthy": orchestrator.overall_status()["bots_success"]},
            "toolchain": {"iverilog": sim.tools_version(), "node": shutil.which("node") is not None}}


@app.get("/api/bots")
def bots() -> List[Dict]:
    return orchestrator.list_bots()


@app.post("/api/bots/{bot_id}/run")
def run_bot(bot_id: str) -> Dict:
    if not re.fullmatch(r"[a-z]{3,20}", bot_id) or bot_id not in orchestrator.BOTS:
        raise HTTPException(404, f"unknown bot '{bot_id}'. Valid: {', '.join(orchestrator.BOTS)}")
    try:
        return orchestrator.run_bot(bot_id)
    except RuntimeError as e:
        raise HTTPException(409, str(e))


@app.get("/api/reports")
def reports() -> List[Dict]:
    out = []
    for r in orchestrator.collect_reports():
        item = dict(r)
        if r["name"].endswith(".json"):
            try:
                d = json.loads((REPORTS_DIR / r["name"]).read_text())
                item["summary"] = d.get("summary") if isinstance(d, dict) else None
                item["bot"] = d.get("bot") if isinstance(d, dict) else None
            except Exception:  # noqa: BLE001
                pass
        out.append(item)
    return out


@app.get("/api/reports/{name}")
def report_file(name: str):
    allowed = {r["name"]: r for r in orchestrator.collect_reports()}
    if name not in allowed:                      # whitelist: prevents path traversal
        raise HTTPException(404, "report not found")
    path = REPORTS_DIR / name
    return PlainTextResponse(path.read_text(), media_type="application/json" if name.endswith(".json") else "text/markdown")


@app.get("/api/dma/status")
def dma_status() -> Dict:
    return SERVICE.status()


@app.post("/api/dma/config")
def dma_config(cfg: DmaConfig) -> Dict:
    return SERVICE.set_config(cfg.src, cfg.dst, cfg.count)


@app.post("/api/dma/start")
def dma_start() -> Dict:
    try:
        return SERVICE.start()
    except SimulationUnavailable as e:
        raise HTTPException(503, str(e))
    except RuntimeError as e:
        raise HTTPException(500, str(e))


@app.post("/api/dma/reset")
def dma_reset() -> Dict:
    return SERVICE.reset()


@app.get("/api/analytics")
def get_analytics() -> Dict:
    return analytics()


@app.get("/api/training/topics")
def training_topics() -> Dict:
    f = training_bot.Facts()
    return {"topics": [{"id": k, "title": t, "content": fn(f)} for k, (t, fn) in training_bot.TOPICS.items()],
            "viva": training_bot.viva_questions(f),
            "modules": [{"name": n, "explanation": training_bot.explain_module(f, n)} for n in f.mods]}


@app.post("/api/training/quiz")
def training_quiz(req: QuizRequest) -> Dict:
    return {"level": req.level, "questions": training_bot.generate_quiz(req.level, req.count, req.seed)}


_dist = FRONTEND_DIR / "dist"
if _dist.exists():                                # serve the built dashboard from the same origin
    app.mount("/assets", StaticFiles(directory=_dist / "assets"), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    def spa(full_path: str):
        if full_path.startswith("api/"):
            raise HTTPException(404, "not found")
        target = (_dist / full_path).resolve()
        if full_path and target.is_file() and _dist.resolve() in target.parents:
            return FileResponse(target)
        return FileResponse(_dist / "index.html")
