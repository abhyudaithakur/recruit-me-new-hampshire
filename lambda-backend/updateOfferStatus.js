import { getConnection } from "./db.js";

export const handler = async (event) => {
  const body = JSON.parse(event.body || "{}");
  const { offer_id, status } = body;

  if (!offer_id || !status)
    return {
      statusCode: 400,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "Missing offer_id or status" }),
    };

  try {
    const pool = await getConnection();
    await pool.query(
      "UPDATE job_offers SET status = ? WHERE offer_id = ?",
      [status, offer_id]
    );

    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ status: "Success" }),
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "Internal Server Error" }),
    };
  }
};
