import mysql from "mysql2/promise";

const { RDS_HOST, RDS_USER, RDS_PASSWORD, RDS_DB } = process.env;

export const handler = async (event) => {
    const qs = event.queryStringParameters || {};
    const q = (qs.q || "").trim();
    const limit = Math.min(parseInt(qs.limit || "50", 10), 200);
    const offset = Math.max(parseInt(qs.offset || "0", 10), 0);

    const conn = await mysql.createConnection({ host: RDS_HOST, user: RDS_USER, password: RDS_PASSWORD, database: RDS_DB });

    const params = [];
    let where = "";
    if (q) { where = "WHERE c.name LIKE ?"; params.push(`%${q}%`); }

    const [rows] = await conn.execute(
        `
    SELECT
      c.company_id,
      c.name,
      c.status,
      c.created_at,
      COALESCE(jc.active_jobs, 0) AS active_jobs
    FROM companies c
    LEFT JOIN (
      SELECT company_id, COUNT(*) AS active_jobs FROM jobs WHERE status = 'OPEN' GROUP BY company_id
    ) jc ON jc.company_id = c.company_id
    ${where}
    ORDER BY c.name ASC
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
