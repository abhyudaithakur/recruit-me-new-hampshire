"use client";

import { IAuthContext, updateCookie, useAuth } from "@/components/AuthProvider";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { MouseEventHandler, useEffect, useState } from "react";
import { SkillList } from "@/components/SkillList";
import axios from "axios";
import ConfirmModal from "./ConfimModel";

const instance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_STAGE,
});

export default function ApplicantDashboard({
  credentials,
}: {
  credentials: IAuthContext;
}) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [load, setLoad] = useState({
    visibility: "hidden",
  } as React.CSSProperties);
  const [err, setErr] = useState("");

  const [offers, setOffers] = useState<
    { offer_id: number; jobName: string; companyid: string; status: string }[]
  >([]);

  const [modal, setModal] = useState<{
    visible: boolean;
    action: "accept" | "reject" | null;
    offerId: number | null;
  }>({
    visible: false,
    action: null,
    offerId: null,
  });

  useEffect(() => {
    // get skills
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
    //get offers
    const fetchOffers = async () => {
      try {
        const res = await fetch(
          "https://3o9qkf05xf.execute-api.us-east-2.amazonaws.com/v1/getOffers",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              pathParameters: { applicantId: Number(credentials.userID) },
            }),
          }
        );

        const data = await res.json();
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
       
      // get skills
      setUsername(credentials.username);
      getSkillsFromDB(credentials.username);
      //get offers
      fetchOffers();
    }
  }, [credentials]);

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
      const res = await fetch(
        `https://3o9qkf05xf.execute-api.us-east-2.amazonaws.com/v1/accept`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ offer_id: offerId, accept: endpoint + "ed" }),
        }
      );
      const data = await res.json();

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

  const [edit, setEdit] = useState(false);


useEffect(()=>{updateCookie(credentials)},[credentials])

const updateName = () => {
        setEdit(false)

        const name = document.getElementById("username") as HTMLInputElement;
        if(name.value == ''){
            setErr('Invalid name')
            return
        }
    
        setLoad({visibility: 'visible'})
        instance.post('/applicantName', {"newName":name.value, "oldName":username, "credendtial":credentials.credential}).then(function (response) {
            const status = response.data.statusCode;
            setLoad({visibility: 'hidden'})

            if (status == 200) {
                setUsername(response.data.newName)
                credentials.setUserName(response.data.newName)
                // updateCookie(credentials)
            }else{
                setErr(response.data.error);
            }

        })
        .catch(function (error: React.SetStateAction<string>) {
            setErr('failed to register: ' + error);
            setLoad({visibility: 'hidden'})
        })
    }

  return (
    <>
      {edit ? (
        <>
          {" "}
          <label htmlFor="username">username </label>
          <input type="text" id="username" defaultValue={username} />
          <button onClick={updateName}>update</button>
        </>
      ) : (
        <>
          <h2>Home Page for {username}</h2>
          <button
            onClick={() => {
              setEdit(true);
            }}>
            edit
          </button>
          <button
        onClick={() => router.push("/jobs")}
        className="bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-800"
      >
        Jobs
      </button>
        </>
      )}
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
