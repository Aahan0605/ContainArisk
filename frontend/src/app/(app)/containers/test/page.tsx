"use client";
import { useEffect, useState } from "react";

export default function TestPage() {
  const [high, setHigh] = useState<any>(null);
  const [low, setLow] = useState<any>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    fetch("http://localhost:8000/containers/high-risk?page=1&limit=5")
      .then(r => r.json()).then(setHigh).catch(e => setErr("HIGH ERR: " + e));
    fetch("http://localhost:8000/containers/low-risk?page=1&limit=5")
      .then(r => r.json()).then(setLow).catch(e => setErr("LOW ERR: " + e));
  }, []);

  return (
    <div style={{ color: "white", padding: 20, fontFamily: "monospace" }}>
      <h2>RAW API TEST</h2>
      {err && <p style={{ color: "red" }}>{err}</p>}
      <h3>HIGH RISK (total: {high?.total ?? "loading..."})</h3>
      <pre style={{ fontSize: 11 }}>{JSON.stringify(high?.data?.[0], null, 2)}</pre>
      <h3>LOW RISK (total: {low?.total ?? "loading..."})</h3>
      <pre style={{ fontSize: 11 }}>{JSON.stringify(low?.data?.[0], null, 2)}</pre>
    </div>
  );
}
