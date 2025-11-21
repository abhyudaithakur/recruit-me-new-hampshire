"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

interface Job {
  jobid: number;
  companyid: number;
  jobstatus: string;
  jobName: string;
  skills: string[];
  applicants?: Applicant[];
}

interface Applicant {
  idapplicant: number;
  name: string;
  credential: string;
  status: string;
}

export default function JobProfilePage() {
  const { jobId} = useParams();
  const { userType, userID } = useAuth();
  const router = useRouter();

  const [job, setJob] = useState<Job | null>(null);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loadingJob, setLoadingJob] = useState(true);
  const [loadingApplicants, setLoadingApplicants] = useState(true);
  const [error, setError] = useState("");
  const [hasApplied, setHasApplied] = useState(false);

  // Fetch job details
  useEffect(() => {
    const fetchJob = async () => {
      if (!jobId) return;

      try {
        const response = await fetch(
          "https://3o9qkf05xf.execute-api.us-east-2.amazonaws.com/v1/job_details",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ jobId: Number(jobId), userId: Number(userID) }),
          }
        );

        const result = await response.json();
        const parsed = JSON.parse(result.body);

        if (response.ok) {
          setJob(parsed.job);
          // Check if the current user has already applied
            setHasApplied(parsed.applied ?? false); 
        } else setError(parsed.error || "Failed to fetch job");
      } catch (err) {
        console.error(err);
        setError("Error fetching job details");
      } finally {
        setLoadingJob(false);
      }
    };

    fetchJob();
  }, [jobId, userID, userType]);

  // Fetch applicants separately if needed
  useEffect(() => {
    const fetchApplicants = async () => {
      if (!jobId) return;

      try {
        console.log("current used is:", userID)
        const response = await fetch(
          "https://3o9qkf05xf.execute-api.us-east-2.amazonaws.com/v1/fetch_job_applicants",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ jobId: Number(jobId), userId: Number(userID) }),
          }
        );

        const result = await response.json();
        const parsed = JSON.parse(result.body);

        if (response.ok) setApplicants(parsed.applicants || []);
        else console.error(parsed.error || "Failed to fetch applicants");
      } catch (err) {
        console.error("Error fetching applicants:", err);
      } finally {
        setLoadingApplicants(false);
      }
    };

    fetchApplicants();
  }, [jobId,userID]);

  // Handles Offer or Reject action for a given applicant
// Handle Offer/Reject action
const handleApplicantAction = async (idapplicant: number, action: "offer" | "reject") => {
  try {
    const response = await fetch(
      "https://3o9qkf05xf.execute-api.us-east-2.amazonaws.com/v1/offer_job",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId: Number(userID), // replace with dynamic company ID
          jobId: Number(jobId),
          applicantId: idapplicant,
          action, // "offer" or "reject"
        }),
      }
    );

    const result = await response.json();
    const parsed = JSON.parse(result.body);

    if (parsed.status === "success") {
      // Update applicant status locally
      setApplicants((prev) =>
        prev.map((app) =>
          app.idapplicant === idapplicant
            ? { ...app, status: action === "offer" ? "Offered" : "Rejected" }
            : app
        )
      );
    } else {
      alert(parsed.error || "Failed to update applicant status");
    }
  } catch (err) {
    console.error("Error updating applicant status:", err);
    alert("Error updating applicant status");
  }
};



  // Apply 
  const handleApply = async () => {
  try {
    const response = await fetch(
      "https://3o9qkf05xf.execute-api.us-east-2.amazonaws.com/v1/apply_job",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: Number(jobId),
          applicantId: Number(userID),
        }),
      }
    );

    const result = await response.json();
    const parsed = JSON.parse(result.body);

    if (response.ok) {
      alert("Applied successfully!");
      setHasApplied(true);
      // Optionally update applicants list
      setApplicants((prev) => [
        ...prev,
        { idapplicant: Number(userID), name: "You", credential: "N/A", status: "Applied" },
      ]);
    } else {
      alert(parsed.error || "Failed to apply");
    }
  } catch (err) {
    console.error(err);
    alert("Error applying for job");
  }
};


  if (loadingJob) return <p className="p-6 animate-pulse">Loading job details...</p>;
  if (error) return <p className="p-6 text-red-600">{error}</p>;
  if (!job) return <p className="p-6">Job not found.</p>;

  return (
    <div className="p-6 max-w-3xl mx-auto bg-white rounded-xl shadow-md mt-6">
      {/* Job Details */}
      <h1 className="text-3xl font-bold text-blue-700 mb-4">{job.jobName}</h1>
      <p className="mb-2">
        <strong>Status:</strong>{" "}
        <span
          className={`font-semibold ${job.jobstatus === "Open" ? "text-green-600" : "text-gray-600"}`}
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

      {/* Apply Button */}
      {userType === "applicant" && job.jobstatus === "Open" && (
  hasApplied ? (
    <p className="mt-4 text-gray-600 font-semibold">Applied</p>
  ) : (
    <button
      onClick={handleApply}
      className="mt-4 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
    >
      Apply
    </button>
  )
)}


      {userType === "company" && (
  <div className="mb-6 mt-6">
    <strong>Applicants:</strong>
    {loadingApplicants ? (
      <p className="mt-2 animate-pulse">Loading applicants...</p>
    ) : applicants.length > 0 ? (
      <table className="table-auto w-full mt-2 border border-gray-200">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-2">Name</th>
            <th className="px-4 py-2">Credential</th>
            <th className="px-4 py-2">Status</th>
            <th className="px-4 py-2">Action</th>
          </tr>
        </thead>
        <tbody>
          {applicants.map((applicant) => (
            <tr key={applicant.idapplicant}>
              <td className="border px-4 py-2">{applicant.name}</td>
              <td className="border px-4 py-2">{applicant.credential}</td>
              <td className="border px-4 py-2">{applicant.status}</td>
              <td className="border px-4 py-2 space-x-2">
                <button
                  className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded"
                  onClick={() => handleApplicantAction(applicant.idapplicant, "offer")}
                  disabled={applicant.status === "Offer"}
                >
                  Offer
                </button>
                <button
                  className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded"
                  onClick={() => handleApplicantAction(applicant.idapplicant, "reject")}
                  disabled={applicant.status === "Reject"}
                >
                  Reject
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    ) : (
      <p className="mt-2 text-gray-600">No applicants yet.</p>
    )}
  </div>
)}

        
      <button
        onClick={() => router.push("/jobs")}
        className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
      >
        Back to Jobs
      </button>
    </div>
  );
}
