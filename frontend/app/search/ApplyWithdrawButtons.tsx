"use client";

import { useEffect, useState } from "react";


const API =
  process.env.NEXT_PUBLIC_API_STAGE ||
  process.env.NEXT_PUBLIC_API_BASE ||
  "";

type Props = { jobId: string | number | undefined | null };

type ApplyOk = { application_id: string | number; job_id: string | number; applicant_id: string | number; reapplied?: boolean; };
type WithdrawOk = { withdrawn: boolean; application_id: string | number; job_id: string | number; applicant_id: string | number; already?: boolean; };
type ErrorEnvelope = { error?: { code?: string; message?: string } };

export default function ApplyWithdrawButtons({ jobId }: Props) {
  const [busy, setBusy] = useState<"apply" | "withdraw" | null>(null);
  const [msg, setMsg] = useState("");

  // const { credentials } = useAuth();
  // const authApplicantId = credentials?.applicantId ? String(credentials.applicantId) : "";

  const [applicantId, setApplicantId] = useState("");

  useEffect(() => {
    // Prefer auth if present; fallback to localStorage (Iteration-1)
    // if (authApplicantId) { setApplicantId(authApplicantId); return; }
    const fromLocal = typeof window !== "undefined" ? localStorage.getItem("applicant_id") : null;
    if (fromLocal) setApplicantId(fromLocal);
  }, []);

  async function act(kind: "apply" | "withdraw") {
    setMsg("");
    if (!API)               { setMsg("API not configured"); return; }
    if (!jobId)             { setMsg("Missing job_id");     return; }
    if (!applicantId)       { setMsg("Login needed");       return; }

    setBusy(kind);
    try {
      const res = await fetch(`${API}/jobs/${encodeURIComponent(String(jobId))}/${kind}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicant_id: applicantId }),
      });
      const data: ApplyOk | WithdrawOk | ErrorEnvelope | unknown = await res.json().catch(() => ({}));
      if (res.status === 201 || res.status === 200) {
        setMsg(kind === "apply" ? "Applied ✅" : "Withdrawn ✅");
      } else {
        const m = (data as ErrorEnvelope)?.error?.message ?? `HTTP ${res.status}`;
        setMsg(`Error: ${m}`);
      }
    } catch (e) {
      setMsg(`Error: ${String(e)}`);
    } finally {
      setBusy(null);
    }
  }

  const disabled = !API || !jobId || !applicantId;

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <button disabled={disabled || busy === "apply"} onClick={() => act("apply")}>
        {busy === "apply" ? "Applying…" : "Apply"}
      </button>
      <button disabled={disabled || busy === "withdraw"} onClick={() => act("withdraw")}>
        {busy === "withdraw" ? "Withdrawing…" : "Withdraw"}
      </button>
      <span style={{ fontSize: 12, opacity: 0.8, marginLeft: 6 }}>
        {msg || (!applicantId ? "Login needed" : "")}
      </span>
    </div>
  );
}
