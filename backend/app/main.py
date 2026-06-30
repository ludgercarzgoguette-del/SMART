from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any

app = FastAPI(title="LOCOMOTIVE PRO X API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ScanInput(BaseModel):
    spy: float = 0
    qqq: float = 0
    nq: float = 0
    comp: float = 0
    vix: float = 0
    oil: float = 0
    dxy: float = 0
    us10y: float = 0
    tsla: float = 0
    meta: float = 0
    rvol: float = 1
    rsi: float = 50
    macd: int = 0
    vwap: int = 0


def clamp(n, lo, hi):
    return max(lo, min(hi, n))


def market_score(d: ScanInput):
    items = [
        ("SPY", d.spy, 18, False), ("QQQ", d.qqq, 18, False), ("NQ", d.nq, 20, False),
        ("COMP", d.comp, 12, False), ("VIX", d.vix, 12, True), ("OIL", d.oil, 6, True),
        ("DXY", d.dxy, 5, True), ("US10Y", d.us10y, 5, True)
    ]
    raw = 0
    parts = []
    total = sum(x[2] for x in items)
    for name, value, weight, inverse in items:
        bullish = value < 0 if inverse else value > 0
        strong = min(abs(value) / 1.0, 1)
        contribution = (1 if bullish else -1) * strong * weight
        raw += contribution
        parts.append({"name": name, "value": value, "weight": weight, "contribution": round(contribution, 2)})
    score = int(clamp(round(50 + (raw / total) * 50), 0, 100))
    return score, parts


def stock_signal(symbol: str, pct: float, d: ScanInput, mscore: int):
    technical = (4 if d.vwap else -4) + (4 if d.macd else -4) + (4 if d.rsi > 55 else -4 if d.rsi < 45 else 0) + (4 if d.rvol > 1.5 else -2)
    momentum = clamp(pct * 18, -12, 12)
    raw = mscore - 50 + technical + momentum
    call = int(clamp(round(50 + raw), 0, 100))
    put = 100 - call
    action = "WAIT"
    if call >= 75:
        action = "CALL"
    if put >= 75:
        action = "PUT"
    confidence = max(call, put) if action != "WAIT" else int(clamp(100 - max(call, put) + 35, 45, 75))
    quality = "A+" if confidence >= 92 else "A" if confidence >= 85 else "B" if confidence >= 75 else "C" if confidence >= 60 else "NO TRADE"
    return {"symbol": symbol, "action": action, "call": call, "put": put, "confidence": confidence, "quality": quality}

@app.get("/")
def root():
    return {"status": "ok", "name": "LOCOMOTIVE PRO X API"}

@app.post("/morning-scan")
def morning_scan(data: ScanInput) -> Dict[str, Any]:
    score, parts = market_score(data)
    tsla = stock_signal("TSLA", data.tsla, data, score)
    meta = stock_signal("META", data.meta, data, score)
    best = sorted([tsla, meta], key=lambda x: x["confidence"], reverse=True)[0]
    return {"market_score": score, "breakdown": parts, "tsla": tsla, "meta": meta, "best_trade": best}
