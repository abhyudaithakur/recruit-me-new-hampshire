"use client";
import { useEffect, useState } from "react";

const API =
    process.env.NEXT_PUBLIC_API_STAGE ||
    process.env.NEXT_PUBLIC_API_BASE ||
    "";

type CompanyRow = {
    company_id: string | number;
    name: string;
    status?: string;
    created_at?: string;
    active_jobs?: number;
};

type JobRow = {
    job_id: string | number;
    title: string;
    status?: string;
    created_at?: string;
    applicants?: number;
};

type ApplicantRow = {
    application_id: string | number;
    job_id: string | number;
    applicant_id: string | number;
    status?: string;
    created_at?: string;
    email?: string;
    first_name?: string;
    last_name?: string;
};

export default function AdminReports() {
    const [q, setQ] = useState("");
    const [companies, setCompanies] = useState<CompanyRow[]>([]);
    const [jobs, setJobs] = useState<JobRow[]>([]);
    const [apps, setApps] = useState<ApplicantRow[]>([]);
    const [selectedCompany, setSelectedCompany] = useState<CompanyRow | null>(null);
    const [selectedJob, setSelectedJob] = useState<JobRow | null>(null);
    const [msg, setMsg] = useState("");

    async function loadCompanies() {
        setMsg("");
        try {
            const url = new URL(`${API}/admin/reports/companies`);
            if (q) url.searchParams.set("q", q);
            const r = await fetch(url.toString());
            const data = await r.json();
            setCompanies(data.items ?? []);
            setJobs([]);
            setApps([]);
            setSelectedCompany(null);
            setSelectedJob(null);
        } catch (e: any) {
            setMsg(String(e));
        }
    }

    async function loadJobsForCompany(c: CompanyRow) {
        setMsg("");
        try {
            const r = await fetch(`${API}/admin/reports/companies/${encodeURIComponent(String(c.company_id))}/jobs`);
            const data = await r.json();
            setSelectedCompany(c);
            setJobs(data.items ?? []);
            setApps([]);
            setSelectedJob(null);
        } catch (e: any) {
            setMsg(String(e));
        }
    }

    async function loadApplicantsForJob(j: JobRow) {
        setMsg("");
        try {
            const r = await fetch(`${API}/admin/reports/jobs/${encodeURIComponent(String(j.job_id))}/applicants`);
            const data = await r.json();
            setSelectedJob(j);
            setApps(data.items ?? []);
        } catch (e: any) {
            setMsg(String(e));
        }
    }

    useEffect(() => { loadCompanies(); }, []);

    return (
        <main style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>
            <h1>Admin Reports</h1>
            <p style={{ opacity: 0.7 }}>API: <code>{API || "(env not set)"}</code></p>

            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <input
                    placeholder="Search companies by name"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    style={{ padding: 8, width: 320 }}
                />
                <button onClick={loadCompanies}>Search</button>
                <span style={{ color: "crimson", marginLeft: 8 }}>{msg}</span>
            </div>

            <h3>Companies</h3>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr>
                    <th style={{ border: "1px solid #ddd", padding: 6 }}>Company</th>
                    <th style={{ border: "1px solid #ddd", padding: 6 }}>Status</th>
                    <th style={{ border: "1px solid #ddd", padding: 6 }}>Active Jobs</th>
                    <th style={{ border: "1px solid #ddd", padding: 6 }}>Actions</th>
                </tr></thead>
                <tbody>
                    {companies.map((c, i) => (
                        <tr key={`${c.company_id}-${i}`}>
                            <td style={{ border: "1px solid #ddd", padding: 6 }}>{c.name}</td>
                            <td style={{ border: "1px solid #ddd", padding: 6 }}>{c.status ?? ""}</td>
                            <td style={{ border: "1px solid #ddd", padding: 6 }}>{c.active_jobs ?? 0}</td>
                            <td style={{ border: "1px solid #ddd", padding: 6 }}>
                                <button onClick={() => loadJobsForCompany(c)}>View Jobs</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {selectedCompany && (
                <>
                    <h3 style={{ marginTop: 24 }}>Jobs — {selectedCompany.name}</h3>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead><tr>
                            <th style={{ border: "1px solid #ddd", padding: 6 }}>Title</th>
                            <th style={{ border: "1px solid #ddd", padding: 6 }}>Status</th>
                            <th style={{ border: "1px solid #ddd", padding: 6 }}>Applicants</th>
                            <th style={{ border: "1px solid #ddd", padding: 6 }}>Actions</th>
                        </tr></thead>
                        <tbody>
                            {jobs.map((j, i) => (
                                <tr key={`${j.job_id}-${i}`}>
                                    <td style={{ border: "1px solid #ddd", padding: 6 }}>{j.title}</td>
                                    <td style={{ border: "1px solid #ddd", padding: 6 }}>{j.status ?? ""}</td>
                                    <td style={{ border: "1px solid #ddd", padding: 6 }}>{j.applicants ?? 0}</td>
                                    <td style={{ border: "1px solid #ddd", padding: 6 }}>
                                        <button onClick={() => loadApplicantsForJob(j)}>View Applicants</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </>
            )}

            {selectedJob && (
                <>
                    <h3 style={{ marginTop: 24 }}>Applicants — Job #{String(selectedJob.job_id)}</h3>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead><tr>
                            <th style={{ border: "1px solid #ddd", padding: 6 }}>Applicant</th>
                            <th style={{ border: "1px solid #ddd", padding: 6 }}>Email</th>
                            <th style={{ border: "1px solid #ddd", padding: 6 }}>Status</th>
                            <th style={{ border: "1px solid #ddd", padding: 6 }}>Applied</th>
                        </tr></thead>
                        <tbody>
                            {apps.map((a, i) => (
                                <tr key={`${a.application_id}-${i}`}>
                                    <td style={{ border: "1px solid #ddd", padding: 6 }}>
                                        {a.first_name ?? ""} {a.last_name ?? ""} (#{String(a.applicant_id)})
                                    </td>
                                    <td style={{ border: "1px solid #ddd", padding: 6 }}>{a.email ?? ""}</td>
                                    <td style={{ border: "1px solid #ddd", padding: 6 }}>{a.status ?? ""}</td>
                                    <td style={{ border: "1px solid #ddd", padding: 6 }}>{a.created_at ?? ""}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </>
            )}
        </main>
    );
}
