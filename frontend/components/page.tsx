"use client";

import { useAuth } from "@/components/AuthProvider";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { MouseEventHandler, useEffect, useState } from "react";
import { SkillList } from "@/components/SkillList";
import axios from "axios";

const instance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_STAGE,
});

// Custom Confirmation Modal Component
function ConfirmModal({
  message,
  onConfirm,
  onCancel,
}: {
  message: string;
  onConfirm: MouseEventHandler<HTMLButtonElement>;
  onCancel: MouseEventHandler<HTMLButtonElement>;
}) {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
      }}>
      <div
        style={{
          backgroundColor: "#fff",
          padding: "20px 30px",
          borderRadius: "10px",
          textAlign: "center",
          minWidth: "300px",
        }}>
        <p>{message}</p>
        <div
          style={{
            marginTop: "20px",
            display: "flex",
            justifyContent: "space-around",
          }}>
          <button onClick={onConfirm} style={{ padding: "5px 15px" }}>
            Yes
          </button>
          <button onClick={onCancel} style={{ padding: "5px 15px" }}>
            No
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ApplicantDashboard() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [load, setLoad] = useState({
    visibility: "hidden",
  } as React.CSSProperties);
  const [err, setErr] = useState("");

  const credentials = useAuth();

  const [offers, setOffers] = useState<{offer_id:number,jobName:string;companyid:string,status:string}[]>([]);

  const [modal, setModal] = useState<{
    visible: boolean;
    action: "accept" | "reject" | null;
    offerId: number | null;
  }>({
    visible: false,
    action: null,
    offerId: null,
  });

  // get skills
  useEffect(() => {
    function getSkillsFromDB(name: string) {
      const body = {
        name: name,
        token: credentials.credential,
        userType: credentials.userType,
      };
      setLoad({ visibility: "visible" });
      instance
        .post("/getProfileSkills", body)
        .then(function (response) {
          const status = response.data.statusCode;
          if (status == 200) {
            setSkills(response.data.skills);
          } else {
            setErr(response.data.error);
            // setLoad({ visibility: "hidden" });
          }
        })
        .catch(function (error: React.SetStateAction<string>) {
          setErr("failed to get skills: " + error);
          // setLoad({ visibility: "hidden" });
        })
        .finally(() => {
          setLoad({ visibility: "hidden" });
        });
    }
    if (!credentials.loading && !credentials.credential) {
      router.push("/login");
    } else if (
      !credentials.loading &&
      credentials.credential &&
      credentials.username
    ) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUsername(credentials.username);
      getSkillsFromDB(credentials.username);
    }
  }, [credentials, router]);

  function sendSkillChanges() {
    const body = {
      name: username,
      token: credentials.credential,
      userType: credentials.userType,
      skills: skills,
    };
    setLoad({ visibility: "visible" });
    instance
      .post("/editUser", body)
      .then(function (response) {
        const status = response.data.statusCode;
        if (status == 200) {
          setSkills(response.data.skills);
        } else {
          setErr(response.data.error);
        }
      })
      .catch(function (error: React.SetStateAction<string>) {
        setErr("failed to set skills: " + error);
      })
      .finally(() => {
        setLoad({ visibility: "hidden" });
      });
  }
  // get offers
  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const res = await fetch(
          "https://3o9qkf05xf.execute-api.us-east-2.amazonaws.com/v1/getOffers",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              pathParameters: { applicantId: Number(credentials.userID)},
            }),
          }
        );

        const data = await res.json();
        console.log(data.body);
      setOffers(JSON.parse(data.body));
      } catch (err) {
        console.error("Error fetching offers:", err);
        setOffers([]);
      }
    };
    if (
      !credentials.loading &&
      credentials.credential &&
      credentials.username
    ) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchOffers();
    }
  }, [credentials]);

  // Accept / Reject modal handlers
  const handleAction = (
    offerId: number,
    action: "accept" | "reject" | null
  ) => {
    setModal({ visible: true, action, offerId });
  };

  const confirmAction = async () => {
    const { action, offerId } = modal;
    const endpoint = action === "accept" ? "accept" : "reject";

    try {
      const res = await fetch(`https://3o9qkf05xf.execute-api.us-east-2.amazonaws.com/v1/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offer_id: offerId, accept: endpoint+'ed' }),
      });
      const data = await res.json();
      console.log(data);

      // Update local state
      setOffers((prev) =>
        prev.map((o) =>
          o.offer_id === offerId
            ? { ...o, status: action === "accept" ? "accepted" : "rejected" }
            : o
        )
      );
    } catch (err) {
      console.error(err);
    } finally {
      setModal({ visible: false, action: null, offerId: null });
    }
  };

  const cancelAction = () =>
    setModal({ visible: false, action: null, offerId: null });

  if (credentials.userType == "Applicant") {
    // get username and skills from db
    // setUsername()
    // setSkills()
  } else if (credentials.userType == "Company") {
  }

  return (
    <>
      <h2>Home Page for {username}</h2>
      <SkillList skills={skills} setSkills={setSkills}></SkillList>
      <button type="submit" onClick={sendSkillChanges}>
        Submit Changes
      </button>
      <img src="/loading-7528_128.gif" alt="" id="loading" style={load} />

      <div style={{ display: "flex", gap: "30px", padding: "20px" }}>
        {/* Offered Jobs Section */}
        <div style={{ flex: 1 }}>
          <h2>Offered Jobs</h2>
          {offers.filter((o) => o.status === "offered").length === 0 ? (
            <p>No offered jobs</p>
          ) : (
            <ul>
              {offers
                .filter((o) => o.status === "offered")
                .map((offer) => (
                  <li key={offer.offer_id} style={{ marginBottom: "10px" }}>
                    {offer.jobName} - {offer.companyid} ({offer.status})
                    <div style={{ marginTop: "5px" }}>
                      <button
                        onClick={() => handleAction(offer.offer_id, "accept")}
                        style={{ marginRight: "10px" }}>
                        Accept
                      </button>
                      <button
                        onClick={() => handleAction(offer.offer_id, "reject")}>
                        Reject
                      </button>
                    </div>
                  </li>
                ))}
            </ul>
          )}
        </div>

        {/* Accepted Jobs Section */}
        <div style={{ flex: 1 }}>
          <h2>Accepted Jobs</h2>
          {offers.filter((o) => o.status === "accepted").length === 0 ? (
            <p>No accepted jobs yet</p>
          ) : (
            <ul>
              {offers
                .filter((o) => o.status === "accepted")
                .map((o) => (
                  <li key={o.offer_id}>
                    {o.jobName} - {o.companyid}
                  </li>
                ))}
            </ul>
          )}
        </div>

        {/* Confirmation Modal */}
        {modal.visible && (
          <ConfirmModal
            message={`Are you sure you want to ${modal.action} this offer?`}
            onConfirm={confirmAction}
            onCancel={cancelAction}
          />
        )}
      </div>
    </>
  );
}
