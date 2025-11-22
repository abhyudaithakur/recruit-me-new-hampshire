"use client";

import { IAuthContext, updateCookie } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { SkillList } from "@/components/SkillList";
import axios from "axios";
import ConfirmModal from "./ConfimModel";

const instance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_STAGE,
});

type Offer = {
  offer_id: number;
  jobName: string;
  companyid: string;
  status: string; // 'offered' | 'accepted' | 'rejected' | 'rescinded'
};

export default function ApplicantDashboard({
  credentials,
}: {
  credentials: IAuthContext;
}) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [load, setLoad] = useState({ visibility: "hidden" } as React.CSSProperties);
  const [err, setErr] = useState("");

  const [offers, setOffers] = useState<Offer[]>([]);
  const [modal, setModal] = useState<{
    visible: boolean;
    action: "accept" | "reject" | "rescind" | null;
    offerId: number | null;
  }>({ visible: false, action: null, offerId: null });

  const [edit, setEdit] = useState(false);

  // Helper to parse API responses
  const parseResponseBody = (apiResponse: any) => {
    if (!apiResponse) return [];
    if (typeof apiResponse === "string") {
      try { return JSON.parse(apiResponse); } catch { return []; }
    }
    if (apiResponse.body && typeof apiResponse.body === "string") {
      try { return JSON.parse(apiResponse.body); } catch { return []; }
    }
    return apiResponse;
  };

  // Fetch skills and offers
  useEffect(() => {
    if (!credentials.loading && credentials.credential && credentials.username) {
      setUsername(credentials.username);

      // fetch skills
      const getSkillsFromDB = (name: string) => {
        setLoad({ visibility: "visible" });
        instance.post("/getProfileSkills", {
          name,
          token: credentials.credential,
          userType: credentials.userType,
        })
        .then(res => {
          if (res.data.statusCode === 200) setSkills(res.data.skills);
          else setErr(res.data.error);
        })
        .catch(err => setErr("Failed to get skills: " + String(err)))
        .finally(() => setLoad({ visibility: "hidden" }));
      };
      getSkillsFromDB(credentials.username);

      // fetch offers
      const fetchOffers = async () => {
        try {
          const res = await fetch(
            "https://3o9qkf05xf.execute-api.us-east-2.amazonaws.com/v1/getOffers",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ pathParameters: { applicantId: Number(credentials.userID) } }),
            }
          );
          const data = await res.json();
          const parsed = parseResponseBody(data);
          const normalized: Offer[] = (parsed || []).map((o: any) => ({
            offer_id: Number(o.offer_id),
            jobName: String(o.jobName ?? o.job_name ?? ""),
            companyid: String(o.companyid ?? o.company_id ?? ""),
            status: String(o.status ?? "").toLowerCase(),
          }));
          setOffers(normalized);
        } catch (err) {
          console.error("Error fetching offers:", err);
          setOffers([]);
        }
      };
      fetchOffers();
    }
  }, [credentials]);

  useEffect(() => { updateCookie(credentials); }, [credentials]);

  function sendSkillChanges() {
    setLoad({ visibility: "visible" });
    instance.post("/editUser", {
      name: username,
      token: credentials.credential,
      userType: credentials.userType,
      skills,
    })
    .then(res => {
      if (res.data.statusCode === 200) setSkills(res.data.skills);
      else setErr(res.data.error);
    })
    .catch(err => setErr("Failed to set skills: " + String(err)))
    .finally(() => setLoad({ visibility: "hidden" }));
  }

  const updateOfferStatus = (offerId: number, status: string) => {
    setOffers(prev => prev.map(o => o.offer_id === offerId ? { ...o, status } : o));
  };

  const handleAction = (offerId: number, action: "accept" | "reject" | "rescind") => {
    setModal({ visible: true, action, offerId });
  };

  const confirmAction = async () => {
    const { action, offerId } = modal;
    if (!action || !offerId) return setModal({ visible: false, action: null, offerId: null });

    try {
      if (action === "rescind") {
        const res = await fetch(
          `https://3o9qkf05xf.execute-api.us-east-2.amazonaws.com/v1/rescind_offer`,
          { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ offer_id: offerId }) }
        );
        const data = await res.json();
        const parsed = parseResponseBody(data);
        if (parsed && (parsed.status === "rescinded" || parsed.status === "success")) updateOfferStatus(offerId, "rescinded");
        else alert(parsed?.error ?? "Failed to rescind offer");
      } else {
        const endpoint = action === "accept" ? "accepted" : "rejected";
        const res = await fetch(
          `https://3o9qkf05xf.execute-api.us-east-2.amazonaws.com/v1/accept`,
          { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ offer_id: offerId, accept: endpoint }) }
        );
        const data = await res.json();
        const parsed = parseResponseBody(data);
        if (parsed && (parsed.status === "success" || parsed.status === "ok")) updateOfferStatus(offerId, endpoint);
        else alert(parsed?.error ?? "Failed to update offer status");
      }
    } catch (err) {
      console.error(err);
      alert("Network error while performing action");
    } finally {
      setModal({ visible: false, action: null, offerId: null });
    }
  };

  const cancelAction = () => setModal({ visible: false, action: null, offerId: null });

  const offered = offers.filter(o => o.status === "offered");
  const accepted = offers.filter(o => o.status === "accepted");
  const rescinded = offers.filter(o => o.status === "rescinded");
  const rejected = offers.filter(o => o.status === "rejected");

  const updateName = () => {
    setEdit(false);
    const nameInput = document.getElementById("username") as HTMLInputElement;
    if (!nameInput || nameInput.value.trim() === "") { setErr("Invalid name"); return; }

    setLoad({ visibility: "visible" });
    instance.post("/applicantName", {
      newName: nameInput.value,
      oldName: username,
      credendtial: credentials.credential,
    })
    .then(res => {
      if (res.data.statusCode === 200) { setUsername(res.data.newName); credentials.setUserName(res.data.newName); }
      else setErr(res.data.error);
    })
    .catch(err => setErr("Failed to update name: " + String(err)))
    .finally(() => setLoad({ visibility: "hidden" }));
  };

  return (
    <>
      {edit ? (
        <>
          <label htmlFor="username">username </label>
          <input type="text" id="username" defaultValue={username} />
          <button onClick={updateName}>update</button>
        </>
      ) : (
        <>
          <h2>Home Page for {username}</h2>
          <button onClick={() => setEdit(true)}>edit</button>
          <button onClick={() => router.push("/jobs")} className="bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-800">Jobs</button>
        </>
      )}

      <SkillList skills={skills} setSkills={setSkills} />
      <button type="submit" onClick={sendSkillChanges}>Submit Changes</button>
      <img src="/loading-7528_128.gif" alt="" id="loading" style={load} />

      <div style={{ display: "flex", gap: 30, padding: 20 }}>
        {/* Offered Jobs */}
        <div style={{ flex: 1 }}>
          <h2>Offered Jobs</h2>
          {offered.length === 0 ? <p>No offered jobs</p> : (
            <ul>
              {offered.map(o => (
                <li key={o.offer_id} style={{ marginBottom: 10 }}>
                  {o.jobName} - {o.companyid} ({o.status})
                  <div style={{ marginTop: 5 }}>
                    <button onClick={() => handleAction(o.offer_id, "accept")} style={{ marginRight: 10 }}>Accept</button>
                    <button onClick={() => handleAction(o.offer_id, "reject")}>Reject</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Accepted Jobs */}
        <div style={{ flex: 1 }}>
          <h2>Accepted Jobs</h2>
          {accepted.length === 0 ? <p>No accepted jobs yet</p> : (
            <ul>
              {accepted.map(o => (
                <li key={o.offer_id} style={{ marginBottom: 10 }}>
                  {o.jobName} - {o.companyid}
                  <button style={{ marginLeft: 10 }} onClick={() => handleAction(o.offer_id, "rescind")}>Rescind</button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Rescinded Jobs */}
        <div style={{ flex: 1 }}>
          <h2>Rescinded Jobs</h2>
          {rescinded.length === 0 ? <p>No rescinded jobs yet</p> : (
            <ul>
              {rescinded.map(o => (
                <li key={o.offer_id}>{o.jobName} - {o.companyid} ({o.status})</li>
              ))}
            </ul>
          )}
        </div>

        {/* Rejected Jobs */}
        <div style={{ flex: 1 }}>
          <h2>Rejected Jobs</h2>
          {rejected.length === 0 ? <p>No rejected jobs yet</p> : (
            <ul>
              {rejected.map(o => (
                <li key={o.offer_id}>{o.jobName} - {o.companyid} ({o.status})</li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {modal.visible && (
        <ConfirmModal
          message={`Are you sure you want to ${modal.action} this offer?`}
          onConfirm={confirmAction}
          onCancel={cancelAction}
        />
      )}
    </>
  );
}
