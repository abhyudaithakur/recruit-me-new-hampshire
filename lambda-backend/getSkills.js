import { getConnection } from "./db.js";

export const handler = async (event) => {
  const applicantId = event.pathParameters?.applicantId;

  try {
    const pool = await getConnection();
    const [rows] = await pool.query(
      `SELECT s.name
       FROM applicant_skills AS a
       JOIN skills AS s ON a.skill_id = s.skill_id
       WHERE a.applicant_id = ?`,
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
