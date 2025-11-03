import mysql from "mysql2/promise";

let pool;
const connect = () => (pool ??= mysql.createPool({
    host: process.env.DB_HOST, user: process.env.DB_USER,
    password: process.env.DB_PASS, database: process.env.DB_NAME,
    waitForConnections: true, connectionLimit: 5
}));

const respond = (code, body) => ({
    statusCode: code,
    headers: {
        "content-type": "application/json",
        "access-control-allow-origin": "*",
        "access-control-allow-headers": "content-type",
        "access-control-allow-methods": "POST,OPTIONS"
    },
    body: JSON.stringify(body)
});

export const handler = async (event) => {
    if (event.httpMethod === "OPTIONS") return respond(200, {});
    try {
        const job_id = event?.pathParameters?.job_id;
        const { applicant_id } =
            typeof event?.body === "string" ? JSON.parse(event.body) : (event?.body || {});
        if (!job_id || !applicant_id)
            return respond(400, { error: { code: "BAD_INPUT", message: "job_id (path) and applicant_id (body) required" } });

        const db = connect();
        const [rows] = await db.execute(
            "SELECT id,status FROM applications WHERE job_id=? AND applicant_id=?",
            [job_id, applicant_id]
        );

        if (rows.length === 0) {
            await db.execute('INSERT INTO applications(job_id, applicant_id, status) VALUES (?,?, "APPLIED")',
                [job_id, applicant_id]);
            const [r] = await db.execute(
                "SELECT id FROM applications WHERE job_id=? AND applicant_id=?",
                [job_id, applicant_id]
            );
            return respond(201, { application_id: r[0].id, job_id, applicant_id });
        }

        const { id, status } = rows[0];
        if (status === "WITHDRAWN") {
            await db.execute('UPDATE applications SET status="APPLIED" WHERE id=?', [id]);
            return respond(200, { application_id: id, job_id, applicant_id, reapplied: true });
        }
        return respond(409, { error: { code: "DUPLICATE", message: "already applied" } });
    } catch (e) {
        console.error(e);
        return respond(500, { error: { code: "SERVER", message: "internal error" } });
    }
};
