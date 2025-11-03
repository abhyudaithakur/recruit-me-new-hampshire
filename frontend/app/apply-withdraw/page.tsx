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
  // --- existing simple inputs ---
  const [jobId, setJobId] = useState("");
  const [applicantId, setApplicantId] = useState("");

  // --- new: lookup state ---
  const [email, setEmail] = useState("");
  const [myApps, setMyApps] = useState<ApplicationRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [resp, setResp] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);

  // remember applicantId so the user doesn’t retype
  useEffect(() => { const saved = localStorage.getItem("applicant_id"); if (saved) setApplicantId(saved); }, []);
  useEffect(() => { if (applicantId) localStorage.setItem("applicant_id", applicantId); }, [applicantId]);

  const apiShown = API || "(env not set)";

  async function applyOrWithdraw(kind: "apply" | "withdraw") {
    setErr(null); setResp(null);
    if (!API) return setErr("API env var not set");
    if (!jobId || !applicantId) return setErr("Need job_id and applicant_id");
    try {
      const r = await fetch(`${API}/jobs/${encodeURIComponent(jobId)}/${kind}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicant_id: applicantId }),
      });
      const data = await r.json().catch(() => ({}));
      setResp({ status: r.status, data });
      if (!r.ok) setErr(`HTTP ${r.status}`);
      // refresh list if we have it
      if (myApps.length && kind === "withdraw" && r.ok) {
        setMyApps(prev => prev.filter(a => String(a.job_id) !== String(jobId)));
      }
    } catch (e: any) {
      setErr(String(e));
    }
  }

  // ----- NEW: look up applicant_id by email -----
  async function findApplicantId() {
    setErr(null); setResp(null); setLoading(true);
    try {
      // Adjust this path to your real endpoint if different (see note below)
      const r = await fetch(`${API}/applicants/lookup?email=${encodeURIComponent(email)}`);
      if (!r.ok) throw new Error(`lookup failed (${r.status})`);
      const data = await r.json();
      // expected: { applicant_id: "app-123", name, email }
      if (!data?.applicant_id) throw new Error("No applicant_id found for that email");
      setApplicantId(String(data.applicant_id));
      setResp({ status: r.status, data });
    } catch (e: any) {
      setErr(String(e));
    } finally { setLoading(false); }
  }

  // ----- NEW: list my active applications (status=APPLIED) -----
  async function listMyApplications() {
    setErr(null); setResp(null); setLoading(true);
    try {
      if (!applicantId) throw new Error("Set applicant_id first (or use email lookup)");
      // Adjust this path to your real endpoint if different (see note below)
      const url = `${API}/applications?applicant_id=${encodeURIComponent(applicantId)}&status=APPLIED`;
      const r = await fetch(url);
      if (!r.ok) throw new Error(`fetch applications failed (${r.status})`);
      const data = await r.json();
      const rows: ApplicationRow[] = data.items ?? data.applications ?? data ?? [];
      setMyApps(rows);
    } catch (e: any) {
      setErr(String(e));
      setMyApps([]);
    } finally { setLoading(false); }
  }

  // withdraw directly from the list
  async function withdrawFromList(jid: string | number) {
    setJobId(String(jid));
    await applyOrWithdraw("withdraw");
  }

  return (
    <main style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <h1>Apply / Withdraw</h1>
      <p style={{ opacity: 0.7 }}>API: <code>{apiShown}</code></p>

      {/* --- A. Quick actions (existing) --- */}
      <section style={{ marginTop: 16 }}>
        <h3>Quick apply / withdraw (for testing)</h3>
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <input placeholder="job_id" value={jobId} onChange={e=>setJobId(e.target.value)} style={{ padding: 8, flex: 1 }}/>
          <input placeholder="applicant_id" value={applicantId} onChange={e=>setApplicantId(e.target.value)} style={{ padding: 8, flex: 1 }}/>
        </div>
        <button onClick={()=>applyOrWithdraw("apply")}>Apply</button>
        <button onClick={()=>applyOrWithdraw("withdraw")} style={{ marginLeft: 8 }}>Withdraw</button>
      </section>

      {/* --- B. Find my IDs / My applications --- */}
      <section style={{ marginTop: 28 }}>
        <h3>Don’t remember your IDs? Find them here</h3>
        <div style={{ display: "flex", gap: 8, alignItems: "center"
