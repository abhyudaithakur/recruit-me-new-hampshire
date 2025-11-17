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
  const companyName = event.companyName;
  const companyCredential = event.companyCredential;

  function checkCredentials(name, credential) {
    return new Promise((resolve, reject) => {
      pool.query(
        "SELECT idcompanies FROM companies WHERE companyName=? and credential=?",
        [name, credential],
        (error, rows) => {
          if (error) {
            // console.log("chek", error);
            reject("Database error");
          } else {
            // console.log("chek", rows);
            resolve({
              valid: rows.length != 0,
              id: rows[0] ? rows[0].idcompanies : -1,
            });
          }
        }
      );
    });
  }

  function checkValidCompanyForJob(jobid, companyid) {
    return new Promise((resolve, reject) => {
      pool.query(
        "SELECT * FROM jobs WHERE jobid=? and companyid=?",
        [jobid, companyid],
        (error, rows) => {
          if (error) {
            // console.log("chek", error);
            reject("Database error");
          } else {
            // console.log("chek", rows);
            resolve({
              valid: rows.length != 0,
            });
          }
        }
      );
    });
  }

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
    if (!jobid) {
      throw new Error("Invalid Job ID");
    }
    const checkCred = await checkCredentials(companyName, companyCredential);
    if (!checkCred.valid) {
      throw new Error("Invalid Credentials");
    }
    const correctPair = await checkValidCompanyForJob(jobid, checkCred.id);
    if (!correctPair.valid) {
      throw new Error("Invalid Credentials");
    }
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
      body: JSON.stringify({ error: err.message ? err.message : err }),
    };
  }

  pool.end();
  return response;
};
