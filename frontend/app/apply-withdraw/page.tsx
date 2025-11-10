"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

const API =
  process.env.NEXT_PUBLIC_API_STAGE ||
  process.env.NEXT_PUBLIC_API_BASE ||
  "";

/** Row returned by the "list my applications" endpoint */
type ApplicationRow = {
  application_id: string | number;
  job_id: string | number;
  title?: string;
  company?: string;
  organization?: string;
  status?: string;
};

/** Success envelopes (keep loose; we only render them) */
type ApplyOk = {
  application_id: string | number;
  job_id: string | number;
  applicant_id: string | number;
  reapplied?: boolean;
};

type WithdrawOk = {
  withdrawn: boolean;
  application_id: string | number;
  job_id: string | number;
  applicant_id: string | number;
  already?: boolean;
};

type ErrorEnvelope = { error?: { code?: string; message?: string } };

/** What we store in the "resp" panel under the page */
type RespPanel =
  | { kind: "apply"; status: number; body: ApplyOk | ErrorEnvelope | unknown }
  | { kind: "withdraw"; status: number; body: WithdrawOk | ErrorEnvelope | unknown }
  | { kind: "info"; status: number; body: unknown };

function ApplyWithdraw() {
  // --- simple inputs (keep old workflow) ---
  const [jobId, setJobId] = useState("");
  const [applicantId, setApplicantId] = useState("");

  // --- lookup state ---
  const [email, setEmail] = useState("");
  const [myApps, setMyApps] = useState<ApplicationRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [resp, setResp] = useState<RespPanel | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // read params like ?job_id=...&applicant_id=...
  const params = useSearchParams();

  // prefill from URL (first paint)
  useEffect(() => {
    const jid = params.get("job_id");
    if (jid) setJobId(jid);
    const aid = params.get("applicant_id");
    if (aid) setApplicantId(aid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount

  // remember applicantId locally so the user doesn’t retype
  useEffect(() => {
    const saved =
      typeof window !== "undefined"
        ? window.localStorage.getItem("applicant_id")
        : null;
    if (saved && !applicantId) setApplicantId(saved);
  }, [applicantId]);

  useEffect(() => {
    if (applicantId && typeof window !== "undefined") {
      window.localStorage.setItem("applicant_id", applicantId);
    }
  }, [applicantId]);

  async function applyOrWithdraw(kind: "apply" | "withdraw") {
    setErr(null);
    setResp(null);
    if (!API) {
      setErr("API env var not set");
      return;
    }
    if (!jobId || !applicantId) {
      setErr("Need job_id and applicant_id");
      return;
    }

    try {
      const r = await fetch(
        `${API}/jobs/${encodeURIComponent(jobId)}/${kind}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ applicant_id: applicantId }),
        }
      );
      const body: unknown = await r.json().catch(() => ({}));
      setResp({
        kind,
        status: r.status,
        body:
          kind === "apply"
            ? (body as ApplyOk | ErrorEnvelope | unknown)
            : (body as WithdrawOk | ErrorEnvelope | unknown),
      });
      if (!r.ok) setErr(`HTTP ${r.status}`);
      if (myApps.length && kind === "withdraw" && r.ok) {
        setMyApps((prev) =>
          prev.filter((a) => String(a.job_id) !== String(jobId))
        );
      }
    } catch (e) {
      setErr(String(e));
    }
  }

  // Find applicant_id by email (adjust endpoint if your backend differs)
  async function findApplicantId() {
    setErr(null);
    setResp(null);
    setLoading(true);
    try {
      const r = await fetch(
        `${API}/applicants/lookup?email=${encodeURIComponent(email)}`
      );
      if (!r.ok) throw new Error(`lookup failed (${r.status})`);
      const data: unknown = await r.json();
      const obj = data as { applicant_id?: string | number };
      if (!obj?.applicant_id)
        throw new Error("No applicant_id found for that email");
      setApplicantId(String(obj.applicant_id));
      setResp({ kind: "info", status: r.status, body: data });
    } catch (e) {
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
      if (!applicantId)
        throw new Error("Set applicant_id first (or use email lookup)");
      const url = `${API}/applications?applicant_id=${encodeURIComponent(
        applicantId
      )}&status=APPLIED`;
      const r = await fetch(url);
      if (!r.ok) throw new Error(`fetch applications failed (${r.status})`);
      const data: unknown = await r.json();
      const rows: ApplicationRow[] = Array.isArray(data)
        ? (data as ApplicationRow[])
        : ((data as { items?: ApplicationRow[]; applications?: ApplicationRow[] })
            .items ??
            (data as { applications?: ApplicationRow[] }).applications ??
            []) as ApplicationRow[];
      setMyApps(rows);
      setResp({ kind: "info", status: r.status, body: data });
    } catch (e) {
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
      <p style={{ opacity: 0.7 }}>
        API: <code>{API || "(env not set)"}</code>
      </p>

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
        <button
          onClick={() => applyOrWithdraw("withdraw")}
          style={{ marginLeft: 8 }}
        >
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
          <span style={{ marginLeft: 8, opacity: 0.75 }}>
            → sets the box above
          </span>
        </div>

        <div style={{ marginTop: 12 }}>
          <button
            onClick={listMyApplications}
            disabled={!applicantId || loading}
          >
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
                <div
                  key={`${a.application_id}-${i}`}
                  style={{ border: "1px solid #ddd", padding: 12 }}
                >
                  <div style={{ fontWeight: 600 }}>
                    {a.title ?? "(job)"} — {a.company ?? a.organization ?? ""}
                  </div>
                  <div
                    style={{
                      fontFamily: "monospace",
                      fontSize: 12,
                      marginTop: 4,
                      opacity: 0.8,
                    }}
                  >
                    job_id: {String(a.job_id)} · application_id:{" "}
                    {String(a.application_id)}
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <button onClick={() => withdrawFromList(a.job_id)}>
                      Withdraw
                    </button>
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

export default function ApplyWithdrawSuspense(){
  return(
    <Suspense>
      <ApplyWithdraw/>
    </Suspense>
  )
}