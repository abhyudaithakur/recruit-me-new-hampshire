"use client";

import { useEffect, useState } from "react";

// Custom Confirmation Modal Component
function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div style={{
      position: "fixed",
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: "rgba(0,0,0,0.5)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: "#fff",
        padding: "20px 30px",
        borderRadius: "10px",
        textAlign: "center",
        minWidth: "300px"
      }}>
        <p>{message}</p>
        <div style={{ marginTop: "20px", display: "flex", justifyContent: "space-around" }}>
          <button onClick={onConfirm} style={{ padding: "5px 15px" }}>Yes</button>
          <button onClick={onCancel} style={{ padding: "5px 15px" }}>No</button>
        </div>
      </div>
    </div>
  );
}

export default function ApplicantDashboard() {
  const [offers, setOffers] = useState([]);
  const [modal, setModal] = useState({ visible: false, action: null, offerId: null });
  const [skills, setSkills] = useState([]);
  useEffect(() => {
  const fetchSkills = async () => {
    try {
      const res = await fetch("http://localhost:5001/skills/2"); // replace 1 with applicantId
      const data = await res.json();
      console.log("Fetched skills:", data);
      setSkills(data);
    } catch (err) {
      console.error("Error fetching skills:", err);
    }
  };
  fetchSkills();
}, []);

useEffect(() => {
  const fetchOffers = async () => {
    try {
      const res = await fetch(
        "https://9irns1xx17.execute-api.us-east-1.amazonaws.com/temp/getOffers",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
  "pathParameters": {
    "applicantId": "1"
  }
})
        }
      );
      const data = await res.json();
      console.log("Fetched offers:", data);

      // Ensure data is an array
      if (Array.isArray(data)) {
        setOffers(data);
      } else if (data.data && Array.isArray(data.data)) {
        setOffers(data.data);
      } else {
        setOffers([]);
      }
    } catch (err) {
      console.error("Error fetching offers:", err);
      setOffers([]);
    }
  };
  fetchOffers();
}, []);



  // Handle Accept / Reject with modal
  const handleAction = (offerId, action) => {
    setModal({ visible: true, action, offerId });
  };

  const confirmAction = async () => {
    const { action, offerId } = modal;
    const endpoint = action === "accept" ? "accept" : "reject";

    try {
      const res = await fetch(`http://localhost:5001/offers/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offer_id: offerId }),
      });
      const data = await res.json();
      console.log(data);

      // Update local state
      setOffers(prev =>
        prev.map(o =>
          o.offer_id === offerId ? { ...o, status: action === "accept" ? "accepted" : "rejected" } : o
        )
      );
    } catch (err) {
      console.error(err);
    } finally {
      setModal({ visible: false, action: null, offerId: null });
    }
  };

  const cancelAction = () => setModal({ visible: false, action: null, offerId: null });

  return (
    <div style={{ display: "flex", gap: "30px", padding: "20px" }}>
      {/* Skills Section */}
      <div style={{ flex: 1 }}>
        <ul>
          <div style={{ flex: 1 }}>
  <h2>Skills</h2>
  {skills.length === 0 ? (
    <p>No skills added yet</p>
  ) : (
    <ul>
      {skills.map(skill => (
        <li key={skill.skill_id}>{skill.name}</li>
      ))}
    </ul>
  )}
</div>

        </ul>
      </div>

      {/* Offered Jobs Section */}
      <div style={{ flex: 1 }}>
        <h2>Offered Jobs</h2>
        {offers.filter(o => o.status === "offered").length === 0 ? (
          <p>No offered jobs</p>
        ) : (
          <ul>
            {offers.filter(o => o.status === "offered").map(offer => (
              <li key={offer.offer_id} style={{ marginBottom: "10px" }}>
                {offer.title} - {offer.company} ({offer.status})
                <div style={{ marginTop: "5px" }}>
                  <button onClick={() => handleAction(offer.offer_id, "accept")} style={{ marginRight: "10px" }}>Accept</button>
                  <button onClick={() => handleAction(offer.offer_id, "reject")}>Reject</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Accepted Jobs Section */}
      <div style={{ flex: 1 }}>
        <h2>Accepted Jobs</h2>
        {offers.filter(o => o.status === "accepted").length === 0 ? (
          <p>No accepted jobs yet</p>
        ) : (
          <ul>
            {offers.filter(o => o.status === "accepted").map(o => (
              <li key={o.offer_id}>{o.title} - {o.company}</li>
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
  );
}
