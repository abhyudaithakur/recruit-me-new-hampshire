import { getConnection } from "./db.js";

export const handler = async (event) => {
  const applicantId = event.pathParameters?.applicantId;

  try {
    const pool = await getConnection();
    const [rows] = await pool.query(
      `SELECT job_offers.offer_id, jobs.title, jobs.company, job_offers.status
       FROM job_offers
       JOIN jobs ON job_offers.job_id = jobs.job_id
       WHERE job_offers.applicant_id = ?`,
      [applicantId]
    );

    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify(rows),
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
