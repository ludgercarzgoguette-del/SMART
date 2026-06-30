import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { Activity, ShieldCheck, Target, TrendingUp, Zap } from "lucide-react";
import "./style.css";

const defaultInputs = {
  spy: 0.25,
  qqq: 0.35,
  nq: 0.4,
  comp: 0.28,
  vix: -1.8,
  oil: 0.1,
  dxy: -0.05,
  us10y: -0.03,
  tsla: 0.55,
  meta: 0.18,
  rvol: 1.6,
  rsi: 57,
  macd: 1,
  vwap: 1,
};

const weights = {
  spy: 18,
  qqq: 18,
  nq: 20,
  comp: 12,
  vix: 12,
  oil: 6,
  dxy: 5,
  us10y: 5,
  stockMomentum: 12,
  technical: 12,
};

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function scoreMarket(data) {
  const parts = [];
  const add = (name, value, weight, inverse = false) => {
    const bullish = inverse ? value < 0 : value > 0;
    const strong = Math.min(Math.abs(value) / 1.0, 1);
    const contribution = (bullish ? 1 : -1) * strong * weight;
    parts.push({ name, value, weight, contribution });
    return contribution;
  };
  let raw = 0;
  raw += add("SPY", data.spy, weights.spy);
  raw += add("QQQ", data.qqq, weights.qqq);
  raw += add("NQ", data.nq, weights.nq);
  raw += add("COMP", data.comp, weights.comp);
  raw += add("VIX", data.vix, weights.vix, true);
  raw += add("OIL", data.oil, weights.oil, true);
  raw += add("DXY", data.dxy, weights.dxy, true);
  raw += add("US10Y", data.us10y, weights.us10y, true);
  const max = weights.spy + weights.qqq + weights.nq + weights.comp + weights.vix + weights.oil + weights.dxy + weights.us10y;
  const score = clamp(Math.round(50 + (raw / max) * 50), 0, 100);
  return { score, parts };
}

function analyzeStock(symbol, data, marketScore) {
  const pct = symbol === "TSLA" ? data.tsla : data.meta;
  const technical = (data.vwap ? 4 : -4) + (data.macd ? 4 : -4) + (data.rsi > 55 ? 4 : data.rsi < 45 ? -4 : 0) + (data.rvol > 1.5 ? 4 : -2);
  const momentum = clamp(pct * 18, -12, 12);
  const raw = marketScore - 50 + technical + momentum;
  const call = clamp(Math.round(50 + raw), 0, 100);
  const put = 100 - call;
  const wait = call >= 75 || put >= 75 ? Math.max(5, 100 - Math.max(call, put)) : 100 - Math.max(call, put);
  let action = "WAIT";
  if (call >= 75) action = "CALL";
  if (put >= 75) action = "PUT";
  const confidence = action === "WAIT" ? clamp(100 - Math.max(call, put) + 35, 45, 75) : Math.max(call, put);
  const quality = confidence >= 92 ? "A+" : confidence >= 85 ? "A" : confidence >= 75 ? "B" : confidence >= 60 ? "C" : "NO TRADE";
  const mockPrice = symbol === "TSLA" ? 390 : 710;
  const atr = symbol === "TSLA" ? 4.8 : 6.5;
  const entry = mockPrice * (1 + pct / 100);
  const stop = action === "PUT" ? entry + atr * 0.35 : entry - atr * 0.35;
  const tp1 = action === "PUT" ? entry - atr * 0.55 : entry + atr * 0.55;
  const tp2 = action === "PUT" ? entry - atr * 0.9 : entry + atr * 0.9;
  return { symbol, action, call, put, wait, confidence, quality, entry, stop, tp1, tp2, technical, momentum };
}

function App() {
  const [inputs, setInputs] = useState(defaultInputs);
  const [journal, setJournal] = useState(() => JSON.parse(localStorage.getItem("lpx_journal") || "[]"));

  const result = useMemo(() => {
    const market = scoreMarket(inputs);
    const tsla = analyzeStock("TSLA", inputs, market.score);
    const meta = analyzeStock("META", inputs, market.score);
    const best = [tsla, meta].sort((a, b) => b.confidence - a.confidence)[0];
    return { market, tsla, meta, best };
  }, [inputs]);

  const update = (key, value) => setInputs((p) => ({ ...p, [key]: Number(value) }));
const runLiveScan = async () => {
  const res = await fetch("https://smart-f7sf.onrender.com/morning-scan", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(inputs)
  });

  const data = await res.json();
  console.log(data);
};
  const saveScan = () => {
    const entry = { date: new Date().toLocaleString(), marketScore: result.market.score, best: result.best, tsla: result.tsla, meta: result.meta, inputs };
    const next = [entry, ...journal].slice(0, 22);
    setJournal(next);
    localStorage.setItem("lpx_journal", JSON.stringify(next));
  };

  const Badge = ({ action }) => <span className={"badge " + action.toLowerCase()}>{action}</span>;

  return (
    <div className="app">
      <header className="hero">
        <div>
          <h1>🚂 LOCOMOTIVE PRO X</h1>
          <p>Opening Bell AI · TSLA/META · 9:30–10:00 AM</p>
        </div>
        <div className="status">LIVE FRONTEND ✅</div>
      </header>

      <section className="cards top">
        <div className="card big">
          <div className="card-title"><Activity size={18}/> Market Balance</div>
          <div className="score">{result.market.score}%</div>
          <div className="bar"><span style={{ width: `${result.market.score}%` }} /></div>
          <p>{result.market.score >= 70 ? "Bullish environment" : result.market.score <= 35 ? "Bearish environment" : "Mixed / wait for confirmation"}</p>
        </div>
        <div className="card big highlight">
          <div className="card-title"><Zap size={18}/> Best Trade</div>
          <div className="best"><Badge action={result.best.action} /> {result.best.symbol}</div>
          <p>Confidence: <b>{result.best.confidence}%</b> · Quality: <b>{result.best.quality}</b></p>
          <button onClick={runLiveScan}>🚀 Save Morning Scan</button>
        </div>
      </section>

      <section className="cards">
        {[result.tsla, result.meta].map((s) => (
          <div className="card" key={s.symbol}>
            <h2>{s.symbol}</h2>
            <Badge action={s.action} />
            <div className="prob"><span>CALL {s.call}%</span><span>PUT {s.put}%</span><span>WAIT {s.wait}%</span></div>
            <div className="levels">
              <div><Target size={15}/> Entry <b>{s.entry.toFixed(2)}</b></div>
              <div>Stop <b>{s.stop.toFixed(2)}</b></div>
              <div>TP1 <b>{s.tp1.toFixed(2)}</b></div>
              <div>TP2 <b>{s.tp2.toFixed(2)}</b></div>
            </div>
          </div>
        ))}
      </section>

      <section className="panel">
        <h2><TrendingUp size={18}/> Market Inputs</h2>
        <div className="inputs">
          {Object.keys(inputs).map((key) => (
            <label key={key}>{key.toUpperCase()}<input type="number" step="0.01" value={inputs[key]} onChange={(e) => update(key, e.target.value)} /></label>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2><ShieldCheck size={18}/> Why?</h2>
        <div className="why">
          {result.market.parts.map((p) => <div key={p.name}><span>{p.name}</span><b>{p.contribution >= 0 ? "+" : ""}{p.contribution.toFixed(1)}</b></div>)}
        </div>
      </section>

      <section className="panel">
        <h2>Journal 22 jou</h2>
        {journal.length === 0 ? <p className="muted">Pa gen scan sove ankò.</p> : journal.map((j, i) => <div className="journal" key={i}>{j.date} · {j.best.symbol} {j.best.action} · {j.best.confidence}%</div>)}
      </section>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
