import mysql from "mysql";

export const handler = async function (event) {
  var pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
  });

  let companyName = event.companyName;
  let skills = event.skills;
  let pageNumber = event.pageNumber;
  let pageSize = event.pageSize;
  let includeClosed = event.includeClosed ? true : false;
  // --- Helper: Count matching jobs --- // function by chatgpt
  function countJobsByFilter({
    companyName = null,
    skills = [],
    includeClosed = false,
  }) {
    return new Promise((resolve, reject) => {
      let baseQuery = `
      SELECT COUNT(DISTINCT j.jobid) AS count
      FROM jobs j
      JOIN companies c ON j.companyid = c.idcompanies
      LEFT JOIN jobs_has_skills js ON j.jobid = js.jobs_jobid
    `;

      const params = [];
      const conditions = [];

      // --- Job status condition ---
      if (includeClosed) {
        conditions.push(`LOWER(j.jobstatus) IN ('open', 'closed')`);
      } else {
        conditions.push(`LOWER(j.jobstatus) = 'open'`);
      }

      // --- Case-insensitive company name ---
      if (companyName) {
        conditions.push(`LOWER(c.companyName) LIKE LOWER(?)`);
        params.push(`%${companyName}%`);
      }

      // --- Case-insensitive skill matching ---
      if (skills && skills.length > 0) {
        conditions.push(
          `LOWER(js.skills_skillname) IN (${skills
            .map(() => "LOWER(?)")
            .join(",")})`
        );
        params.push(...skills);
      }

      if (conditions.length > 0) {
        baseQuery += ` WHERE ` + conditions.join(" AND ");
      }

      pool.query(baseQuery, params, (error, rows) => {
        if (error) reject("Database error: " + error);
        else resolve(rows[0].count);
      });
    });
  }

  // --- Helper: Get job list --- // function by chatgpt
  function getJobsByFilter({
    companyName = null,
    skills = [],
    includeClosed = false,
    pageNumber = 1,
    pageSize = 10,
  }) {
    return new Promise((resolve, reject) => {
      let baseQuery = `
      SELECT 
        j.jobid,
        c.companyName,
        j.jobstatus,
        j.jobName,
        GROUP_CONCAT(DISTINCT js.skills_skillname) AS skills
      FROM jobs j
      JOIN companies c ON j.companyid = c.idcompanies
      LEFT JOIN jobs_has_skills js ON j.jobid = js.jobs_jobid
    `;

      const params = [];
      const conditions = [];

      // --- Job status condition ---
      if (includeClosed) {
        conditions.push(`LOWER(j.jobstatus) IN ('open', 'closed')`);
      } else {
        conditions.push(`LOWER(j.jobstatus) = 'open'`);
      }

      // --- Case-insensitive company name ---
      if (companyName) {
        conditions.push(`LOWER(c.companyName) LIKE LOWER(?)`);
        params.push(`%${companyName}%`);
      }

      // --- Case-insensitive skill matching ---
      if (skills && skills.length > 0) {
        conditions.push(
          `LOWER(js.skills_skillname) IN (${skills
            .map(() => "LOWER(?)")
            .join(",")})`
        );
        params.push(...skills);
      }

      if (conditions.length > 0) {
        baseQuery += ` WHERE ` + conditions.join(" AND ");
      }

      baseQuery += `
      GROUP BY j.jobid
      ORDER BY j.jobid DESC
      LIMIT ? OFFSET ?
    `;

      const offset = (pageNumber - 1) * pageSize;
      params.push(pageSize, offset);

      pool.query(baseQuery, params, (error, rows) => {
        if (error) reject("Database error: " + error);
        else {
          const formatted = rows.map((r) => ({
            jobId: r.jobid,
            companyName: r.companyName,
            jobName: r.jobName,
            jobStatus: r.jobstatus,
            skills: r.skills ? r.skills.split(",") : [],
          }));
          resolve(formatted);
        }
      });
    });
  }

  // --- Combine everything ---
  let response = {}
  try {
    const totalResultCount = await countJobsByFilter({
      companyName,
      skills,
      includeClosed,
    });
    const jobs = await getJobsByFilter({
      companyName,
      skills,
      pageNumber,
      pageSize,
      includeClosed,
    });

    response =  {
      statusCode: 200,
      pageNumber,
      totalResultCount,
      pageSize,
      pageResultCount: jobs.length,
      jobs,
    };
  } catch (err) {
    response = {
      statusCode: 400,
      error: err,
    };
  }
  pool.end();
  return response
};

