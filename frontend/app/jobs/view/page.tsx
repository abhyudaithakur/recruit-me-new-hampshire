"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

import ConfirmModal from "@/components/ConfimModel";

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
  status_statusType: string;
  offerStatus?: string | null;
}

export default function JobViewPage() {
  const searchParams = useSearchParams();
  const jobIdParam = searchParams.get("jobId");
  const jobId = jobIdParam ? Number(jobIdParam) : null;

  const { userType, userID } = useAuth();
  const router = useRouter();

  const [job, setJob] = useState<Job | null>(null);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loadingJob, setLoadingJob] = useState(true);
  const [loadingApplicants, setLoadingApplicants] = useState(true);
  const [error, setError] = useState("");
  const [hasApplied, setHasApplied] = useState(false);

  // CONFIRM MODAL STATES
  const [showConfirm, setShowConfirm] = useState(false);
  const [newStatus, setNewStatus] = useState<"Open" | "Closed">("Open");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const currentApplicant = applicants.find(
    (a) => a.idapplicant === Number(userID)
  );

  const [confirmApplicantAction, setConfirmApplicantAction] = useState<{
    id: number;
    action: "offer" | "reject";
  } | null>(null);

  if (!jobId) return <p className="p-6 text-red-600">Job ID not provided.</p>;

  // -----------------------------
  // Fetch job details
  // -----------------------------
  useEffect(() => {
    if (!jobId) return;
    const fetchJob = async () => {
      try {
        const response = await fetch(
          "https://3o9qkf05xf.execute-api.us-east-2.amazonaws.com/v1/job_details",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              jobId: jobId,
              userId: Number(userID),
            }),
          }
        );

        const result = await response.json();
        const parsed = JSON.parse(result.body);

        if (response.ok) {
          setJob(parsed.job);
          setHasApplied(parsed.applied ?? false);
        } else {
          setError(parsed.error || "Failed to fetch job");
        }
      } catch (err) {
        console.error(err);
        setError("Error fetching job details");
      } finally {
        setLoadingJob(false);
      }
    };

    fetchJob();
  }, [jobId, userID, userType]);

  // -----------------------------
  // Fetch applicants
  // -----------------------------
  useEffect(() => {
    if (!jobId) return;
    const fetchApplicants = async () => {
      try {
        const response = await fetch(
          "https://3o9qkf05xf.execute-api.us-east-2.amazonaws.com/v1/fetch_job_applicants",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ jobId, userId: Number(userID) }),
          }
        );

        const result = await response.json();
        const parsed = JSON.parse(result.body);

        if (response.ok) {
          setApplicants(parsed.applicants || []);
        } else {
          console.error(parsed.error || "Failed to fetch applicants");
        }
      } catch (err) {
        console.error("Error fetching applicants:", err);
      } finally {
        setLoadingApplicants(false);
      }
    };

    fetchApplicants();
  }, [jobId, userID]);

  // -----------------------------
  // Update job status
  // -----------------------------
  const handleUpdateJobStatus = async () => {
    try {
      setUpdatingStatus(true);

      const response = await fetch(
        "https://3o9qkf05xf.execute-api.us-east-2.amazonaws.com/v1/update_job_status",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jobId,
            companyId: Number(userID),
            status: newStatus,
          }),
        }
      );

      const result = await response.json();
      const parsed = JSON.parse(result.body);

      if (response.ok && parsed.status === "success") {
        setJob((prev) => (prev ? { ...prev, jobstatus: newStatus } : prev));
        alert("Job status updated!");
      } else {
        alert(parsed.error || "Failed to update job status");
      }
    } catch (err) {
      console.error("Error updating job status:", err);
      alert("Error updating job status");
    } finally {
      setUpdatingStatus(false);
      setShowConfirm(false);
    }
  };

  // -----------------------------
  // Offer / Reject applicant
  // -----------------------------
  const handleApplicantAction = async (idapplicant: number, action: "offer" | "reject") => {
  try {
    const response = await fetch(
      "https://3o9qkf05xf.execute-api.us-east-2.amazonaws.com/v1/offer_job",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId: Number(userID),
          jobId: Number(jobId),
          applicantId: idapplicant,
          action,
        }),
      }
    );

    const result = await response.json();
    const parsed = JSON.parse(result.body);

    if (parsed.status === "success") {
      // ✅ Update offerStatus immediately
      setApplicants((prev) =>
        prev.map((app) =>
          app.idapplicant === idapplicant
            ? { ...app, offerStatus: action === "offer" ? "Offered" : "Rejected" }
            : app
        )
      );
    } else {
      alert(parsed.error || "Failed to update applicant status");
    }
  } catch (err) {
    console.error(err);
    alert("Error updating applicant");
  } finally {
    setConfirmApplicantAction(null);
  }
};


  // -----------------------------
  // Withdraw application
  // -----------------------------
  const handleWithdraw = async () => {
    try {
      const response = await fetch(
        "https://3o9qkf05xf.execute-api.us-east-2.amazonaws.com/v1/withdraw",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jobId,
            applicantId: Number(userID),
          }),
        }
      );

      const result = await response.json();
      const parsed = JSON.parse(result.body);

      if (parsed.status === "success") {
        setHasApplied(false);
        setApplicants((prev) =>
          prev.map((app) =>
            app.idapplicant === Number(userID)
              ? { ...app, status_statusType: "Withdrawn" }
              : app
          )
        );
      } else {
        alert(parsed.error || "Failed to withdraw");
      }
    } catch (err) {
      console.error(err);
      alert("Error withdrawing job application");
    }
  };

  // -----------------------------
  // Apply for job
  // -----------------------------
  const handleApply = async () => {
    try {
      const response = await fetch(
        "https://3o9qkf05xf.execute-api.us-east-2.amazonaws.com/v1/apply_job",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jobId,
            applicantId: Number(userID),
          }),
        }
      );

      const result = await response.json();
      const parsed = JSON.parse(result.body);

      if (response.ok) {
        alert("Applied successfully!");
        setHasApplied(true);
        setApplicants((prev) => [
          ...prev,
          {
            idapplicant: Number(userID),
            name: "You",
            credential: "N/A",
            status_statusType: "Applied",
          },
        ]);
      } else {
        alert(parsed.error || "Failed to apply");
      }
    } catch (err) {
      console.error(err);
      alert("Error applying");
    }
  };

  if (loadingJob) return <p className="p-6 animate-pulse">Loading ..</p>;
  if (error) return <p className="p-6 text-red-600">{error}</p>;
  if (!job) return <p className="p-6">Job not found.</p>;

  return (
    <div className="p-6 max-w-3xl mx-auto bg-white rounded-xl shadow-md mt-6">
      <h1 className="text-3xl font-bold text-blue-700 mb-4">{job.jobName}</h1>

      <p className="mb-2">
        <strong>Status:</strong>{" "}
        <span
          className={`font-semibold ${
            job.jobstatus === "Open" ? "text-green-600" : "text-gray-600"
          }`}
        >
          {job.jobstatus}
        </span>
      </p>

      {userType === "company" && (
        <div className="mb-4">
          <label className="font-semibold mr-2">Change Status:</label>
          <select
            value={job.jobstatus}
            onChange={(e) => {
              setNewStatus(e.target.value as "Open" | "Closed");
              setShowConfirm(true);
            }}
            className="border px-3 py-2 rounded"
            disabled={updatingStatus}
          >
            <option value="Open">Open</option>
            <option value="Draft">Draft</option>
            <option value="Closed">Close</option>
          </select>
        </div>
      )}

      {/* Applicants Table */}
      {userType === "company" && (
        <div className="mt-6">
          <strong>Applicants:</strong>
          {loadingApplicants ? (
            <p className="mt-2">Loading...</p>
          ) : applicants.length > 0 ? (
            <table className="table-auto w-full mt-2 border border-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2">Name</th>
                  <th className="px-4 py-2">Status (Active/Withdrawn)</th>
                  <th className="px-4 py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {applicants.map((applicant) => {
                  const isWithdrawn = applicant.status_statusType === "Withdrawn";

                  return (
                    <tr key={applicant.idapplicant}>
                      <td className="border px-4 py-2">{applicant.name}</td>
                      <td className="border px-4 py-2">
                        {applicant.offerStatus ?? applicant.status_statusType}
                      </td>
                      <td className="border px-4 py-2 space-x-2">
                        {applicant.offerStatus ? (
                          <span className="font-semibold text-blue-700">
                            {applicant.offerStatus}
                          </span>
                        ) : isWithdrawn ? (
                          <span className="font-semibold text-gray-500">
                            Withdrawn
                          </span>
                        ) : (
                          <>
                            <button
                              className="bg-green-500 text-white px-2 py-1 rounded"
                              onClick={() =>
                                setConfirmApplicantAction({
                                  id: applicant.idapplicant,
                                  action: "offer",
                                })
                              }
                            >
                              Offer
                            </button>
                            <button
                              className="bg-red-500 text-white px-2 py-1 rounded"
                              onClick={() =>
                                setConfirmApplicantAction({
                                  id: applicant.idapplicant,
                                  action: "reject",
                                })
                              }
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <p className="mt-2 text-gray-600">No applicants yet.</p>
          )}
        </div>
      )}

      {/* Applicant Actions */}
      {userType === "applicant" &&
        !hasApplied &&
        !applicants.some(
          (a) =>
            a.idapplicant === Number(userID) &&
            a.status_statusType === "Withdrawn"
        ) &&
        job.jobstatus === "Open" && (
          <button
            onClick={handleApply}
            className="mt-4 bg-green-600 text-white px-4 py-2 rounded-lg"
          >
            Apply for this Job
          </button>
        )}

      {userType === "applicant" &&
        hasApplied &&
        currentApplicant?.status_statusType !== "Withdrawn" &&
        job.jobstatus === "Open" && (
          <button
            onClick={handleWithdraw}
            className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg"
          >
            Withdraw Application
          </button>
        )}

      {userType === "applicant" &&
        applicants.some(
          (a) =>
            a.idapplicant === Number(userID) &&
            a.status_statusType === "Withdrawn"
        ) && (
          <p className="mt-4 text-gray-600 font-semibold">
            Application Withdrawn
          </p>
        )}

      <button
        onClick={() => router.push("/jobs")}
        className="mt-6 bg-blue-600 text-white px-4 py-2 rounded-lg"
      >
        Back to Jobs
      </button>

      {confirmApplicantAction && (
  <ConfirmModal
    message={`Are you sure you want to ${confirmApplicantAction.action} this applicant?`}
    onConfirm={() => handleApplicantAction(confirmApplicantAction.id, confirmApplicantAction.action)}
    onCancel={() => setConfirmApplicantAction(null)}
  />
)}


      {confirmApplicantAction && (
        <ConfirmModal
          message={`Are you sure you want to ${confirmApplicantAction.action} this applicant?`}
          onConfirm={async () => {
            await handleApplicantAction(
              confirmApplicantAction.id,
              confirmApplicantAction.action
            );
            setConfirmApplicantAction(null);
          }}
          onCancel={() => setConfirmApplicantAction(null)}
        />
      )}
    </div>
  );
}
