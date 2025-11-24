import mysql from "mysql2/promise";

const { RDS_HOST, RDS_USER, RDS_PASSWORD, RDS_DB } = process.env;

export const handler = async (event) => {
    const { job_id } = event.pathParameters || {};
    const qs = event.queryStringParameters || {};
    const limit = Math.min(parseInt(qs.limit || "50", 10), 200);
    const offset = Math.max(parseInt(qs.offset || "0", 10), 0);

    if (!job_id) {
        return { statusCode: 400, body: JSON.stringify({ error: { message: "job_id required" } }) };
    }

    const conn = await mysql.createConnection({ host: RDS_HOST, user: RDS_USER, password: RDS_PASSWORD, database: RDS_DB });

    const [rows] = await conn.execute(
        `
    SELECT
      a.application_id,
      a.job_id,
      a.applicant_id,
      a.status,
      a.created_at,
      ap.email,
      ap.first_name,
      ap.last_name
    FROM applications a
    JOIN applicants ap ON ap.applicant_id = a.applicant_id
    WHERE a.job_id = ?
    ORDER BY a.created_at DESC
    LIMIT ? OFFSET ?
    `,
        [job_id, limit, offset]
    );

    await conn.end();

    return {
        statusCode: 200,
        headers: { "content-type": "application/json", "access-control-allow-origin": "*" },
        body: JSON.stringify({ items: rows, limit, offset })
    };
};
