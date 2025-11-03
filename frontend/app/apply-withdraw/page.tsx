"use client";

import { useState } from "react";

const API =
  process.env.NEXT_PUBLIC_API_STAGE ||
  process.env.NEXT_PUBLIC_API_BASE ||
  "";

export default function Page() {
  const [jobId, setJobId] = useState("");
  const [applicantId, setApplicantId] = useState("");
  const [resp, setResp] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);

  async function post(path: "apply" | "withdraw") {
    setErr(null);
    setResp(null);
    try {
      const res = await fetch(`${API}/jobs/${jobId}/${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicant_id: applicantId }),
      });
      const data = await res.json().catch(() => ({}));
      setResp({ status: res.status, data });
    } catch (e: any) {
      setErr(String(e));
    }
  }

  return (
    <main style={{ padding: 24, maxWidth: 680, margin: "0 auto" }}>
      <h1>Apply / Withdraw</h1>
      <p style={{ opacity: 0.7 }}>
        API: <code>{API || "(env not set)"}</code>
      </p>
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <input
          placeholder="job_id"
          value={jobId}
          onChange={(e) => setJobId(e.target.value)}
          style={{ flex: 1, padding: 8 }}
        />
        <input
          placeholder="applicant_id"
          value={applicantId}
          onChange={(e) => setApplicantId(e.target.value)}
          style={{ flex: 1, padding: 8 }}
        />
      </div>
      <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
        <button onClick={() => post("apply")}>Apply</button>
        <button onClick={() => post("withdraw")}>Withdraw</button>
      </div>
      {err && <pre style={{ color: "crimson", marginTop: 16 }}>{err}</pre>}
      <pre style={{ marginTop: 16 }}>
        {resp ? JSON.stringify(resp, null, 2) : "—"}
      </pre>
    </main>
  );
}
