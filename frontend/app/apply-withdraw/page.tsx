"use client";

import { useEffect, useState } from "react";

const API =
  process.env.NEXT_PUBLIC_API_STAGE ||
  process.env.NEXT_PUBLIC_API_BASE ||
  "";

type ApplicationRow = {
  application_id: string | number;
  job_id: string | number;
  title?: string;
  company?: string;
  organization?: string;
  status?: string;
};

export default function ApplyWithdraw() {
  // --- simple inputs (keep old workflow) ---
  const [jobId, setJobId] = useState("");
  const [applicantId, setApplicantId] = useState("");

  // --- lookup state ---
  const [email, setEmail] = useState("");
  const [myApps, setMyApps] = useState<ApplicationRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [resp, setResp] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);

  // remember applicantId locally
  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("applicant_id") : null;
    if (saved) setApplicantId(saved);
  }, []);
  useEffect(() => {
    if (applicantId && typeof window !== "undefined") {
      localStorage.setItem("applicant_id", applicantId);
    }
  }, [applicantId]);

  async function applyOrWithdraw(kind: "apply" | "withdraw") {
    setErr(null);
    setResp(null);
    if (!API) { setErr("API env var not set"); return; }
    if (!jobId || !applicantId) { setErr("Need job_id and applicant_id"); return; }

    try {
      const r = await fetch(`${API}/jobs/${encodeURIComponent(jobId)}/${kind}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicant_id: applicantId }),
      });
      const data = await r.json().catch(() => ({}));
      setResp({ status: r.status, data });
      if (!r.ok) setErr(`HTTP ${r.status}`);
      if (myApps.length && kind === "withdraw" && r.ok) {
        setMyApps(prev => prev.filter(a => String(a.job_id) !== String(jobId)));
      }
    } catch (e: any) {
      setErr(String(e));
    }
  }

  // Find applicant_id by email (adjust endpoint if your backend differs)
  async function findApplicantId() {
    setErr(null);
    setResp(null);
    setLoading(true);
    try {
      const r = await fetch(`${API}/applicants/lookup?email=${encodeURIComponent(email)}`);
      if (!r.ok) throw new Error(`lookup failed (${r.status})`);
      const data = await r.json();
      if (!data?.applicant_id) throw new Error("No applicant_id found for that email");
      setApplicantId(String(data.applicant_id));
      setResp({ status: r.status, data });
    } catch (e: any) {
      setErr(String(e));
    } finally {
      setLoading(false);
    }
  }

  // List active applications (adjust endpoint if your backend differs)
  async function listMyApplications() {
    setErr(null);
    setResp(null);
    setLoading(true);
    try {
      if (!applicantId) throw new Error("Set applicant_id first (or use email lookup)");
      const url = `${API}/applications?applicant_id=${encodeURIComponent(applicantId)}&status=APPLIED`;
      const r = await fetch(url);
      if (!r.ok) throw new Error(`fetch applications failed (${r.status})`);
      const data = await r.json();
      const rows: ApplicationRow[] = data.items ?? data.applications ?? data ?? [];
      setMyApps(rows);
    } catch (e: any) {
      setErr(String(e));
      setMyApps([]);
    } finally {
      setLoading(false);
    }
  }

  async function withdrawFromList(jid: string | number) {
    setJobId(String(jid));
    await applyOrWithdraw("withdraw");
  }

  return (
    <main style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <h1>Apply / Withdraw</h1>
      <p style={{ opacity: 0.7 }}>API: <code>{API || "(env not set)"}</code></p>

      {/* A. Quick actions (existing) */}
      <section style={{ marginTop: 16 }}>
        <h3>Quick apply / withdraw (for testing)</h3>
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <input
            placeholder="job_id"
            value={jobId}
            onChange={(e) => setJobId(e.target.value)}
            style={{ padding: 8, flex: 1 }}
          />
          <input
            placeholder="applicant_id"
            value={applicantId}
            onChange={(e) => setApplicantId(e.target.value)}
            style={{ padding: 8, flex: 1 }}
          />
        </div>
        <button onClick={() => applyOrWithdraw("apply")}>Apply</button>
        <button onClick={() => applyOrWithdraw("withdraw")} style={{ marginLeft: 8 }}>
          Withdraw
        </button>
      </section>

      {/* B. Find my IDs / My applications */}
      <section style={{ marginTop: 28 }}>
        <h3>Don’t remember your IDs? Find them here</h3>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            placeholder="your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ padding: 8, width: 320 }}
          />
          <button onClick={findApplicantId} disabled={!email || loading}>
            Find applicant_id
          </button>
          <span style={{ marginLeft: 8, opacity: 0.75 }}>→ sets the box above</span>
        </div>

        <div style={{ marginTop: 12 }}>
          <button onClick={listMyApplications} disabled={!applicantId || loading}>
            List my active applications
          </button>
        </div>

        <div style={{ marginTop: 12 }}>
          {myApps.length === 0 ? (
            <div style={{ opacity: 0.7 }}>
              {loading ? "Loading..." : "No active applications yet."}
            </div>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {myApps.map((a, i) => (
                <div key={`${a.application_id}-${i}`} style={{ border: "1px solid #ddd", padding: 12 }}>
                  <div style={{ fontWeight: 600 }}>
                    {a.title ?? "(job)"} — {a.company ?? a.organization ?? ""}
                  </div>
                  <div style={{ fontFamily: "monospace", fontSize: 12, marginTop: 4, opacity: 0.8 }}>
                    job_id: {String(a.job_id)} · application_id: {String(a.application_id)}
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <button onClick={() => withdrawFromList(a.job_id)}>Withdraw</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section style={{ marginTop: 20 }}>
        {err && <pre style={{ color: "crimson" }}>{err}</pre>}
        <pre>{resp ? JSON.stringify(resp, null, 2) : "{}"}</pre>
      </section>
    </main>
  );
}
