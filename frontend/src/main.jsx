import React from "react";
import { createRoot } from "react-dom/client";
import "./style.css";

function App() {
  return (
    <div className="app">
      <h1>🚂 LOCOMOTIVE PRO X</h1>
      <p>Opening Bell Trading Assistant</p>

      <div className="card">
        <h2>Morning Scan</h2>
        <button>🚀 Run Morning Scan</button>
      </div>

      <div className="grid">
        <div className="box">TSLA: WAIT</div>
        <div className="box">META: WAIT</div>
        <div className="box">Market Balance: Loading</div>
        <div className="box">AI Confidence: --%</div>
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
