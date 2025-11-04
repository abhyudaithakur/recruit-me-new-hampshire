// backend/server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectToDatabase } from "./db.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5001;

// ⚡ Middleware
app.use(cors({
  origin: "http://localhost:3000",
  methods: ["GET","POST","PUT","DELETE"],
  credentials: true
}));
app.use(express.json());

// ✅ Ping route for testing server connectivity
app.get("/ping", (req, res) => {
  console.log("Ping route hit!");
  res.send("pong");
});

// 🟢 Fetch job offers for applicant
app.get("/offers/:applicantId", async (req, res) => {
  console.log("GET /offers route hit", req.params.applicantId);

  try {
    const connection = await connectToDatabase();
    const [rows] = await connection.execute(
      `SELECT job_offers.offer_id, jobs.title, jobs.company, job_offers.status
       FROM job_offers
       JOIN jobs ON job_offers.job_id = jobs.job_id
       WHERE job_offers.applicant_id = ?`,
      [req.params.applicantId]
    );

    console.log("Rows fetched from DB:", rows);
    await connection.end();
    res.json(rows);
  } catch (err) {
    console.error("Error in /offers/:applicantId:", err);
    res.status(500).json({ error: err.message });
  }
});

// 🟢 Accept offer
app.post("/offers/accept", async (req, res) => {
  try {
    const { offer_id } = req.body;
    const connection = await connectToDatabase();
    await connection.execute(
      "UPDATE job_offers SET status = 'accepted' WHERE offer_id = ?",
      [offer_id]
    );
    await connection.end();
    res.json({ message: "Offer accepted successfully!" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 🟢 Reject offer
app.post("/offers/reject", async (req, res) => {
  try {
    const { offer_id } = req.body;
    const connection = await connectToDatabase();
    await connection.execute(
      "UPDATE job_offers SET status = 'rejected' WHERE offer_id = ?",
      [offer_id]
    );
    await connection.end();
    res.json({ message: "Offer rejected successfully!" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Fetch skills for an applicant
app.get("/skills/:applicantId", async (req, res) => {
  try {
    const connection = await connectToDatabase();
    const [rows] = await connection.execute(
      `SELECT s.skill_id, s.name
       FROM skills s
       JOIN applicant_skills a_s ON s.skill_id = a_s.skill_id
       WHERE a_s.applicant_id = ?`,
      [req.params.applicantId]
    );
    await connection.end();
    res.json(rows);
  } catch (error) {
    console.error("Error fetching skills:", error);
    res.status(500).json({ error: error.message });
  }
});


// Start server on all interfaces (0.0.0.0) to avoid macOS binding issues
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Backend server running on http://localhost:${PORT}`);
});
