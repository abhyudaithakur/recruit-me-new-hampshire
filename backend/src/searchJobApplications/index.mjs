import mysql from "mysql";

export const handler = async function (event) {
  var pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
  });

  const jobid = event.jobid;
  const status = event.status || "active";
  const pageNumber = event.pageNumber || 1;
  const pageSize = event.pageSize || 10;
  // function by chatgpt
  // --- Helper: Count matching applicants ---
  function countApplicantsByFilter({ jobid, status }) {
    return new Promise((resolve, reject) => {
      const baseQuery = `
      SELECT COUNT(DISTINCT jha.applicants_idapplicant) AS count
      FROM jobs_has_applicants jha
      WHERE jha.jobs_jobid = ? 
      AND LOWER(jha.status_statusType) = LOWER(?)
      `;
      pool.query(baseQuery, [jobid, status], (error, rows) => {
        if (error) reject("Database error: " + error);
        else resolve(rows[0].count);
      });
    });
  }
  // function by chatgpt
  // --- Helper: Get applicants list ---
  function getApplicantsByFilter({ jobid, status, pageNumber, pageSize }) {
    return new Promise((resolve, reject) => {
      let query = `
        SELECT 
          a.idapplicant AS id,
          a.applicantname AS name,
          ja.status_statusType AS status,
          GROUP_CONCAT(DISTINCT s.skillname) AS skills
        FROM jobs_has_applicants ja
        JOIN applicants a ON ja.applicants_idapplicant = a.idapplicant
        LEFT JOIN applicants_has_skills aps ON a.idapplicant = aps.applicants_idapplicant
        LEFT JOIN skill s ON aps.skills_skillname = s.skillname
        WHERE ja.jobs_jobid = ? AND LOWER(ja.status_statusType) = ?
        GROUP BY a.idapplicant, a.applicantname, ja.status_statusType
        ORDER BY a.idapplicant ASC
        LIMIT ? OFFSET ?
      `;

      const offset = (pageNumber - 1) * pageSize;
      pool.query(query, [jobid, status, pageSize, offset], (error, rows) => {
        if (error) reject("Database error: " + error);
        else {
          const applicants = rows.map((r) => ({
            id: r.id,
            name: r.name,
            status: r.status,
            skills: r.skills ? r.skills.split(",") : [],
          }));
          resolve(applicants);
        }
      });
    });
  }

  // --- Combine everything ---
  let response;
  try {
    const totalResultCount = await countApplicantsByFilter({ jobid, status });
    const applicants = await getApplicantsByFilter({
      jobid,
      status,
      pageNumber,
      pageSize,
    });

    response = {
      statusCode: 200,
      body: JSON.stringify({
        pageNumber,
        totalResultCount,
        pageSize,
        pageResultCount: applicants.length,
        applicants,
      }),
    };
  } catch (err) {
    response = {
      statusCode: 400,
      body: JSON.stringify({ error: err }),
    };
  }

  pool.end();
  return response;
};
