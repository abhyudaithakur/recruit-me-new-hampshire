import { connectToDatabase } from "./db.js";

const testDb = async () => {
  try {
    const connection = await connectToDatabase();
    console.log("✅ Connected to DB!");
    
    const [rows] = await connection.execute("SELECT * FROM job_offers LIMIT 5");
    console.log(rows);

    await connection.end();
  } catch (err) {
    console.error("❌ DB connection error:", err.message);
  }
};

testDb();
