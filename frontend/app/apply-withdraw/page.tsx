"use client";

import { useEffect, useMemo, useState } from "react";

const API =
  process.env.NEXT_PUBLIC_API_STAGE ||
  process.env.NEXT_PUBLIC_API_BASE ||
  "";

type Job = {
  id?: string | number;
  job_id?: string | number;
  title?: string;
  company?: string;
  organization?: string;
  location?: string;
  [k: string]: any;
};

export default function Page() {
  const [applicantId, setApplicantId] = useState("");
  const [jobQuery, setJobQuery] = useState("");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [resp, setResp] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);

  // persist applicant id locally so the user doesn’t keep typing it
  useEffect(() => {
    const saved = localStorage.getItem("applicant_id");
    if (saved) setApplicantId(saved);
  }, []);
  useEffect(() => {
    if (applicantId) localStorage.setItem("applicant_id", applicantId);
  }, [applicantId]);

  const apiShown = useMemo(() => API || "(env not set)", []);

  async function searchJobs() {
    setErr(null);
    setResp(null);
    setLoading(true);
    try {
      // Try a couple of likely endpoints; adjust if your backend differs.
      const endpoints = [
        `${API}/jobs/search?q=${encodeURIComponent(jobQuery)}`,
        `${API}/search?q=${encodeURIComponent(jobQuery)}`
      ].filter(Boolean);

      let data: any | null = null;
      for (const url of endpoints) {
        const r = await fetch(url);
        if (r.ok) { data = await r.json(); break; }
      }
      if (!data) throw new Error("Search endpoint not found or returned non-200");

      // normalize: many backends use items/jobs/results
      const list: Job[] = data.items ?? data.jobs ?? data.results ?? data ?? [];
      setJobs(list);
    } catch (e: any) {
      setErr(String(e));
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }

  function getJobId(j: Job) {
    return String(j.job_id ?? j.id ?? "");
  }

  async function act(jobId: string, action: "apply" | "withdraw") {
    setErr(null);
    setResp(null);
    if (!API) { setErr("API env var not set"); return; }
    if (!jobId || !applicantId) { setErr("Need job_id and applicant_id"); return; }

    const url = `${API}/jobs/${encodeURIComponent(jobId)}/${action}`;
    try {
      const r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicant_id: applicantId })
      });
      const data = await r.json().catch(() => ({}));
      setResp({ status: r.status, data });
      if (!r.ok) setErr(`HTTP ${r.status}`);
    } catch (e: any) {
      setErr(String(e));
    }
  }

  return (
    <main style={{ padding: 24, maxWidth: 900, margin: "0 auto", lineHeight: 1.5 }}>
      <h1>Apply / Withdraw</h1>
      <p style={{ opacity: 0.7 }}>API: <code>{apiShown}</code></p>

      {/* Who is applying? (kept for Iteration-1; later this comes from auth/session) */}
      <section style={{ marginTop: 16 }}>
        <h3>Who are you?</h3>
        <input
          placeholder="applicant_id (temporary, until auth)"
          value={applicantId}
          onChange={(e) => setApplicantId(e.target.value)}
          style={{ padding: 8, width: 360 }}
        />
        <span style={{ marginLeft: 8, opacity: 0.7 }}>
          saved to your browser
        </span>
      </section>

      {/* Search jobs */}
      <section style={{ marginTop: 24 }}>
        <h3>Search jobs</h3>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            placeholder="title, company, keyword..."
            value={jobQuery}
            onChange={(e) => setJobQuery(e.target.value)}
            style={{ padding: 8, flex: 1 }}
          />
          <button onClick={searchJobs} disabled={!API || loading}>
            {loading ? "Searching..." : "Search"}
          </button>
        </div>

        {/* Results */}
        <div style={{ marginTop: 16, display: "grid", gap: 10 }}>
          {jobs.length === 0 && !loading && (
            <div style={{ opacity: 0.7 }}>No results yet. Try searching.</div>
          )}
          {jobs.map((j, i) => {
            const jobId = getJobId(j);
            return (
              <div key={`${jobId}-${i}`} style={{ border: "1px solid #ddd", padding: 12 }}>
                <div style={{ fontWeight: 600 }}>{j.title ?? "(untitled job)"} </div>
                <div style={{ opacity: 0.9 }}>
                  {(j.company ?? j.organization ?? "")} · {j.location ?? ""}
                </div>
                <div style={{ marginTop: 6, fontFamily: "monospace", fontSize: 12, opacity: 0.8 }}>
                  job_id: {jobId || "(missing)"} 
                </div>
                <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
                  <button onClick={() => act(jobId, "apply")} disabled={!jobId || !applicantId}>
                    Apply
                  </button>
                  <button onClick={() => act(jobId, "withdraw")} disabled={!jobId || !applicantId}>
                    Withdraw
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Developer/testing panel */}
      <section style={{ marginTop: 24 }}>
        {err && <pre style={{ color: "crimson" }}>{err}</pre>}
        <pre>{resp ? JSON.stringify(resp, null, 2) : "{}"}</pre>
      </section>
    </main>
  );
}

