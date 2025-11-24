import mysql from "mysql2/promise";
const { RDS_HOST, RDS_USER, RDS_PASSWORD, RDS_DB } = process.env;

export const handler = async (event) => {
    const qs = event.queryStringParameters || {};
    const q = (qs.q || "").trim(); // optional search by email/name
    const page = Math.max(parseInt(qs.page || "1", 10), 1);
    const pageSize = Math.min(Math.max(parseInt(qs.pageSize || "10", 10), 1), 100);
    const offset = (page - 1) * pageSize;

    const conn = await mysql.createConnection({ host: RDS_HOST, user: RDS_USER, password: RDS_PASSWORD, database: RDS_DB });

    const where = q ? `WHERE (ap.email LIKE ? OR ap.first_name LIKE ? OR ap.last_name LIKE ?)` : "";
    const params = q ? [`%${q}%`, `%${q}%`, `%${q}%`] : [];

    const [tot] = await conn.execute(
        `SELECT COUNT(*) AS total FROM applicants ap ${where}`,
        params
    );
    const total = tot[0]?.total ?? 0;

    const [rows] = await conn.execute(
        `
    SELECT
      ap.applicant_id,
      ap.email,
      ap.first_name,
      ap.last_name,
      COALESCE(COUNT(a.application_id),0) AS applied_count,
      COALESCE(SUM(CASE WHEN a.status='HIRED' THEN 1 ELSE 0 END),0) AS accepted_count,
      COALESCE(SUM(CASE WHEN a.status='WITHDRAWN' THEN 1 ELSE 0 END),0) AS withdrawn_count
    FROM applicants ap
    LEFT JOIN applications a ON a.applicant_id = ap.applicant_id
    ${where}
    GROUP BY ap.applicant_id
    ORDER BY applied_count DESC, ap.applicant_id ASC
    LIMIT ? OFFSET ?
    `,
        [...params, pageSize, offset]
    );

    await conn.end();

    return {
        statusCode: 200,
        headers: { "content-type": "application/json", "access-control-allow-origin": "*" },
        body: JSON.stringify({ items: rows, page, pageSize, total })
    };
};
