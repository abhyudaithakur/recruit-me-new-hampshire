import mysql from "mysql2/promise";

const { RDS_HOST, RDS_USER, RDS_PASSWORD, RDS_DB } = process.env;

export const handler = async (event) => {
    const { company_id } = event.pathParameters || {};
    const qs = event.queryStringParameters || {};
    const status = qs.status || "";
    const limit = Math.min(parseInt(qs.limit || "50", 10), 200);
    const offset = Math.max(parseInt(qs.offset || "0", 10), 0);

    if (!company_id) {
        return { statusCode: 400, body: JSON.stringify({ error: { message: "company_id required" } }) };
    }

    const conn = await mysql.createConnection({ host: RDS_HOST, user: RDS_USER, password: RDS_PASSWORD, database: RDS_DB });

    let where = "WHERE j.company_id = ?";
    const params = [company_id];

    if (status && status !== "ALL") {
        where += " AND j.status = ?";
        params.push(status);
    }

    const [rows] = await conn.execute(
        `
    SELECT
      j.job_id,
      j.title,
      j.status,
      j.created_at,
      COALESCE(app.cnt, 0) AS applicants
    FROM jobs j
    LEFT JOIN (
      SELECT job_id, COUNT(*) AS cnt FROM applications GROUP BY job_id
    ) app ON app.job_id = j.job_id
    ${where}
    ORDER BY j.created_at DESC
    LIMIT ? OFFSET ?
    `,
        [...params, limit, offset]
    );

    await conn.end();

    return {
        statusCode: 200,
        headers: { "content-type": "application/json", "access-control-allow-origin": "*" },
        body: JSON.stringify({ items: rows, limit, offset })
    };
};
