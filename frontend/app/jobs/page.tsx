"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

export default function JobsPage() {
  const { userID,userType } = useAuth();
  const [jobs, setJobs] = useState([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);

  const PAGE_SIZE = 5;
  const router = useRouter();

  interface body{
    companyId: number
  }

  interface j{
    title: string,
    jobId: number,
    description: string,
    status: string
  }

  const fetchJobs = async () => {
    try {
      const body = {} as body;

    // Company should only see their jobs
    if (userType === "company") {
      body.companyId = Number(userID);
    }
      
      const response = await fetch(
        "https://3o9qkf05xf.execute-api.us-east-2.amazonaws.com/v1/Fetch_jobs",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );

      const data = await response.json();
      const parsedData = JSON.parse(data.body);
      setJobs(parsedData.jobs || []);
    } catch (error) {
      console.error("Error fetching jobs:", error);
    }
  };

  useEffect(() => {
    if (userID) fetchJobs();
  }, [userID]);

  /** -----------------------------
   *  Filtering Logic
   ----------------------------- */
  const filteredJobs = useMemo(() => {
    return jobs
      .filter((j: j) => j.title.toLowerCase().includes(search.toLowerCase()))
      .filter((j: j) => (statusFilter === "All" ? true : j.status === statusFilter));
  }, [jobs, search, statusFilter]);

  /** -----------------------------
   * Pagination Logic
   ----------------------------- */
  const totalPages = Math.ceil(filteredJobs.length / PAGE_SIZE);
  const paginatedJobs = filteredJobs.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const changePage = (p: number) => {
    if (p < 1 || p > totalPages) return;
    setCurrentPage(p);
  };

  return (
    <div className="p-6">
{/* Header with optional Create Job button */}
<div className="flex justify-between items-center mb-6">
  <h1 className="text-2xl font-semibold">My Jobs</h1>
  {userType === "company" && (
    <button
      onClick={() => router.push("/jobs/new")}
      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
    >
      Create Job
    </button>
  )}
</div>


      {/* Search + Filter */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <input
          type="text"
          placeholder="Search by title..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1);
          }}
          className="border px-4 py-2 rounded-lg w-full md:w-1/3"
        />

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="border px-4 py-2 rounded-lg w-full md:w-1/4"
        >
          <option value="All">All Status</option>
          <option value="Open">Open</option>
          <option value="Closed">Closed</option>
          <option value="Draft">Draft</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
  <table style={{width:900}}>
    <thead className="bg-gray-200">
      <tr>
        <th className="p-3 border border-black text-left">Job Title</th>
        <th className="p-3 border border-black text-left">Description</th>
    
        <th className="p-3 border border-black text-left">Status</th>
        <th className="p-3 border border-black text-center w-32">Action</th>
      </tr>
    </thead>

    <tbody>
      {paginatedJobs.length === 0 ? (
        <tr>
          <td colSpan={5} className="text-center p-4 border border-black text-gray-600">
            No jobs found.
          </td>
        </tr>
      ) : (
        paginatedJobs.map((job: j) => (
          <tr key={job.jobId}>
            <td className="p-3 border border-black">{job.title}</td>
            <td className="p-3 border border-black text-sm">{job.description}</td>
            
            <td className="p-3 border border-black text-sm font-semibold">{job.status}</td>
            <td className="p-3 border border-black text-center">
              <button
                onClick={() => router.push(`/jobs/${job.jobId}`)}
                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                View
              </button>
            </td>
          </tr>
        ))
      )}
    </tbody>
  </table>
</div>


      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-6">
          <button
            onClick={() => changePage(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Prev
          </button>

          <span className="font-semibold">
            {currentPage} / {totalPages}
          </span>

          <button
            onClick={() => changePage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
