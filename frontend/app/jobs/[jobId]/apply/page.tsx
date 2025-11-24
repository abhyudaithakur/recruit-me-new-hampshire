"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

export default function ApplyJobPage() {
  const { jobId } = useParams();
  const { userID, userType } = useAuth();
  const router = useRouter();

  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hasApplied, setHasApplied] = useState(false);

  useEffect(() => {
    const fetchJob = async () => {
      if (!jobId) return;

      try {
        const res = await fetch(
          "https://3o9qkf05xf.execute-api.us-east-2.amazonaws.com/v1/job_details",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ jobId: Number(jobId) }),
          }
        );

        const data = await res.json();
        const parsed = JSON.parse(data.body);

        if (res.ok) {
          setJob(parsed.job);

          // Check if applicant has already applied
          if (userType === "applicant" && parsed.job.applicants) {
            const applied = parsed.job.applicants.some(
              (app: any) => app.idapplicant === userID
            );
            setHasApplied(applied);
          }
        } else {
          setError(parsed.error || "Failed to fetch job");
        }
      } catch (err) {
        console.error(err);
        setError("Error fetching job details");
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [jobId, userID, userType]);

  const handleApply = async () => {
    if (userType !== "applicant") return;

    try {
      const res = await fetch(
        "https://3o9qkf05xf.execute-api.us-east-2.amazonaws.com/v1/apply_job",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jobId: Number(jobId),
            applicantId: userID,
          }),
        }
      );

      const data = await res.json();
      const parsed = JSON.parse(data.body);

      if (res.ok) {
        alert("Applied successfully!");
        setHasApplied(true); // mark as applied
      } else {
        alert(parsed.error || "Failed to apply");
      }
    } catch (err) {
      console.error(err);
      alert("Error applying for job");
    }
  };

  if (loading) return <p className="p-6 animate-pulse">Loading job details...</p>;
  if (error) return <p className="p-6 text-red-600">{error}</p>;
  if (!job) return <p className="p-6">Job not found.</p>;

  return (
    <div className="p-6 max-w-3xl mx-auto bg-white rounded-xl shadow-md mt-6">
      <h1 className="text-3xl font-bold text-blue-700 mb-4">{job.jobName}</h1>
      <p className="mb-2">
        <strong>Status:</strong>{" "}
        <span
          className={
            job.jobstatus === "Open"
              ? "text-green-600 font-semibold"
              : "text-gray-600 font-semibold"
          }
        >
          {job.jobstatus}
        </span>
      </p>
      <p className="mb-4">
        <strong>Company ID:</strong> {job.companyid}
      </p>

      <div className="mb-6">
        <strong>Required Skills:</strong>
        {job.skills.length > 0 ? (
          <ul className="list-disc list-inside mt-2">
            {job.skills.map((skill) => (
              <li key={skill}>{skill}</li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-600 mt-2">No skills listed.</p>
        )}
      </div>

      {userType === "applicant" && job.jobstatus === "Open" && (
        hasApplied ? (
          <p className="mt-4 text-gray-600 font-semibold">Applied</p>
        ) : (
          <button
            onClick={handleApply}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
          >
            Apply
          </button>
        )
      )}
    </div>
  );
}
