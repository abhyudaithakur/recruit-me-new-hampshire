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
    jobs_count: number;
    applications_count: number;
    hired_count: number;
};

type JobRow = {
    job_id: string | number;
    title: string;
    status?: string;
    created_at?: string;
    applicants_total: number;
    offered_count: number;
    hired_count: number;
    withdrawn_count: number;
};

type ApplicantAgg = {
    applicant_id: string | number;
    email?: string;
    first_name?: string;
    last_name?: string;
    applied_count: number;
    accepted_count: number;
    withdrawn_count: number;
};

function Pager({
    page, pageSize, total, onPage,
}: { page: number; pageSize: number; total: number; onPage: (p: number) => void }) {
    const maxPage = Math.max(Math.ceil(total / pageSize), 1);
    return (
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button disabled={page <= 1} onClick={() => onPage(page - 1)}>Prev</button>
            <span>Page {page} of {maxPage} (total {total})</span>
            <button disabled={page >= maxPage} onClick={() => onPage(page + 1)}>Next</button>
        </div>
    );
}

export default function Admin() {
    const [tab, setTab] = useState<"companies" | "applicants">("companies");

    // companies
    const [qComp, setQComp] = useState("");
    const [companies, setCompanies] = useState<CompanyRow[]>([]);
    const [cPage, setCPage] = useState(1);
    const [cPageSize] = useState(10);
    const [cTotal, setCTotal] = useState(0);
    const [selectedCompany, setSelectedCompany] = useState<CompanyRow | null>(null);

    // jobs for selected company
    const [jobs, setJobs] = useState<JobRow[]>([]);
    const [jPage, setJPage] = useState(1);
    const [jPageSize] = useState(10);
    const [jTotal, setJTotal] = useState(0);

    // applicants summary
    const [qApp, setQApp] = useState("");
    const [apps, setApps] = useState<ApplicantAgg[]>([]);
    const [aPage, setAPage] = useState(1);
    const [aPageSize] = useState(10);
    const [aTotal, setATotal] = useState(0);

    const [msg, setMsg] = useState("");

    async function loadCompanies(page = cPage) {
        setMsg("");
        const url = new URL(`${API}/admin/reports/companies`);
        url.searchParams.set("page", String(page));
        url.searchParams.set("pageSize", String(cPageSize));
        if (qComp) url.searchParams.set("q", qComp);
        const r = await fetch(url.toString());
        if (!r.ok) { setMsg(`companies ${r.status}`); setCompanies([]); setCTotal(0); return; }
        const data = await r.json();
        setCompanies(data.items ?? []);
        setCTotal(data.total ?? 0);
        setCPage(data.page ?? page);
    }

    async function loadJobs(company_id: string | number, page = jPage) {
        setMsg("");
        const r = await fetch(`${API}/admin/reports/companies/${company_id}/jobs?page=${page}&pageSize=${jPageSize}`);
        if (!r.ok) { setMsg(`jobs ${r.status}`); setJobs([]); setJTotal(0); return; }
        const data = await r.json();
        setJobs(data.items ?? []);
        setJTotal(data.total ?? 0);
        setJPage(data.page ?? page);
    }

    async function loadApplicants(page = aPage) {
        setMsg("");
        const url = new URL(`${API}/admin/reports/applicants`);
        url.searchParams.set("page", String(page));
        url.searchParams.set("pageSize", String(aPageSize));
        if (qApp) url.searchParams.set("q", qApp);
        const r = await fetch(url.toString());
        if (!r.ok) { setMsg(`applicants ${r.status}`); setApps([]); setATotal(0); return; }
        const data = await r.json();
        setApps(data.items ?? []);
        setATotal(data.total ?? 0);
        setAPage(data.page ?? page);
    }

    useEffect(() => { loadCompanies(1); }, []); // initial

    return (
        <main style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>
            <h1>Admin Reports</h1>
            <p style={{ opacity: .7 }}>API: <code>{API || "(env not set)"}</code></p>

            <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                <button onClick={() => setTab("companies")} disabled={tab === "companies"}>Companies</button>
                <button onClick={() => setTab("applicants")} disabled={tab === "applicants"}>Applicants</button>
                <span style={{ color: "crimson" }}>{msg}</span>
            </div>

            {tab === "companies" && (
                <>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
                        <input placeholder="search companies…" value={qComp} onChange={e => setQComp(e.target.value)} style={{ padding: 8, width: 320 }} />
                        <button onClick={() => { setSelectedCompany(null); setJPage(1); loadCompanies(1); }}>Search</button>
                        <div style={{ marginLeft: "auto" }}>
                            <Pager page={cPage} pageSize={cPageSize} total={cTotal} onPage={(p) => loadCompanies(p)} />
                        </div>
                    </div>

                    <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 16 }}>
                        <thead><tr>
                            <th style={{ border: "1px solid #ddd", padding: 6 }}>Company</th>
                            <th style={{ border: "1px solid #ddd", padding: 6 }}># Jobs</th>
                            <th style={{ border: "1px solid #ddd", padding: 6 }}># Applications</th>
                            <th style={{ border: "1px solid #ddd", padding: 6 }}># Hired</th>
                            <th style={{ border: "1px solid #ddd", padding: 6 }}>Actions</th>
                        </tr></thead>
                        <tbody>
                            {companies.map((c, i) => (
                                <tr key={`${c.company_id}-${i}`}>
                                    <td style={{ border: "1px solid #ddd", padding: 6 }}>{c.name}</td>
                                    <td style={{ border: "1px solid #ddd", padding: 6 }}>{c.jobs_count}</td>
                                    <td style={{ border: "1px solid #ddd", padding: 6 }}>{c.applications_count}</td>
                                    <td style={{ border: "1px solid #ddd", padding: 6 }}>{c.hired_count}</td>
                                    <td style={{ border: "1px solid #ddd", padding: 6 }}>
                                        <button onClick={() => { setSelectedCompany(c); setJPage(1); loadJobs(c.company_id, 1); }}>View Jobs</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {selectedCompany && (
                        <>
                            <h3>Jobs — {selectedCompany.name}</h3>
                            <div style={{ marginBottom: 8 }}>
                                <Pager page={jPage} pageSize={jPageSize} total={jTotal} onPage={(p) => loadJobs(selectedCompany.company_id, p)} />
                            </div>
                            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                <thead><tr>
                                    <th style={{ border: "1px solid #ddd", padding: 6 }}>Title</th>
                                    <th style={{ border: "1px solid #ddd", padding: 6 }}>Status</th>
                                    <th style={{ border: "1px solid #ddd", padding: 6 }}>Applicants</th>
                                    <th style={{ border: "1px solid #ddd", padding: 6 }}>Offered</th>
                                    <th style={{ border: "1px solid #ddd", padding: 6 }}>Hired</th>
                                    <th style={{ border: "1px solid #ddd", padding: 6 }}>Withdrawn</th>
                                </tr></thead>
                                <tbody>
                                    {jobs.map((j, i) => (
                                        <tr key={`${j.job_id}-${i}`}>
                                            <td style={{ border: "1px solid #ddd", padding: 6 }}>{j.title}</td>
                                            <td style={{ border: "1px solid #ddd", padding: 6 }}>{j.status}</td>
                                            <td style={{ border: "1px solid #ddd", padding: 6 }}>{j.applicants_total}</td>
                                            <td style={{ border: "1px solid #ddd", padding: 6 }}>{j.offered_count}</td>
                                            <td style={{ border: "1px solid #ddd", padding: 6 }}>{j.hired_count}</td>
                                            <td style={{ border: "1px solid #ddd", padding: 6 }}>{j.withdrawn_count}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </>
                    )}
                </>
            )}

            {tab === "applicants" && (
                <>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
                        <input placeholder="search email or name…" value={qApp} onChange={e => setQApp(e.target.value)} style={{ padding: 8, width: 320 }} />
                        <button onClick={() => loadApplicants(1)}>Search</button>
                        <div style={{ marginLeft: "auto" }}>
                            <Pager page={aPage} pageSize={aPageSize} total={aTotal} onPage={(p) => loadApplicants(p)} />
                        </div>
                    </div>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead><tr>
                            <th style={{ border: "1px solid #ddd", padding: 6 }}>Applicant</th>
                            <th style={{ border: "1px solid #ddd", padding: 6 }}>Email</th>
                            <th style={{ border: "1px solid #ddd", padding: 6 }}># Applied</th>
                            <th style={{ border: "1px solid #ddd", padding: 6 }}># Accepted/Hired</th>
                            <th style={{ border: "1px solid #ddd", padding: 6 }}># Withdrawn</th>
                        </tr></thead>
                        <tbody>
                            {apps.map((a, i) => (
                                <tr key={`${a.applicant_id}-${i}`}>
                                    <td style={{ border: "1px solid #ddd", padding: 6 }}>{a.first_name ?? ""} {a.last_name ?? ""} (#{String(a.applicant_id)})</td>
                                    <td style={{ border: "1px solid #ddd", padding: 6 }}>{a.email ?? ""}</td>
                                    <td style={{ border: "1px solid #ddd", padding: 6 }}>{a.applied_count}</td>
                                    <td style={{ border: "1px solid #ddd", padding: 6 }}>{a.accepted_count}</td>
                                    <td style={{ border: "1px solid #ddd", padding: 6 }}>{a.withdrawn_count}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </>
            )}
        </main>
    );
}
