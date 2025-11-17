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

  //function by chatgpt
  function buildJobSearchQuery({
    skills = [],
    includeClosed = false,
    companyName = null,
    pageNumber = 1,
    pageSize = 20,
  }) {
    let baseWhere = ` WHERE 1=1 `;
    const params = [];

    // Job status filter
    if (!includeClosed) {
      baseWhere += ` AND j.jobstatus = 'open' `;
    } else {
      baseWhere += ` AND j.jobstatus IN ('open','closed') `;
    }

    // Company filter
    if (companyName) {
      baseWhere += ` AND LOWER(c.companyName) LIKE ? `;
      params.push(`%${companyName.toLowerCase()}%`);
    }

    // Skills filter
    let skillsFilter = "";
    if (skills.length > 0) {
      skillsFilter = `
      WHERE s.jobs_jobid IN (
        SELECT inner_s.jobs_jobid
        FROM jobs_has_skills inner_s
        WHERE LOWER(inner_s.skills_skillname) IN (${skills
          .map(() => "?")
          .join(", ")})
        GROUP BY inner_s.jobs_jobid
        HAVING COUNT(DISTINCT LOWER(inner_s.skills_skillname)) = ?
      )
    `;
      for (const skill of skills) params.push(skill.toLowerCase());
      params.push(skills.length);
    }

    const sql = `
    SELECT 
      j.jobid,
      j.companyid,
      j.jobName,
      c.companyName,
      b.skills,
      j.jobstatus
    FROM jobs j
    JOIN (
        SELECT 
          s.jobs_jobid,
          GROUP_CONCAT(s.skills_skillname) AS skills
        FROM jobs_has_skills s
        ${skillsFilter}
        GROUP BY s.jobs_jobid
    ) b ON j.jobid = b.jobs_jobid
    JOIN companies c ON c.idcompanies = j.companyid
    ${baseWhere}
    LIMIT ? OFFSET ?
  `;

    const countSql = `
    SELECT COUNT(*) AS total
    FROM jobs j
    JOIN (
        SELECT 
          s.jobs_jobid
        FROM jobs_has_skills s
        ${skillsFilter}
        GROUP BY s.jobs_jobid
    ) b ON j.jobid = b.jobs_jobid
    JOIN companies c ON c.idcompanies = j.companyid
    ${baseWhere}
  `;

    return {
      sql,
      countSql,
      params,
      paginationParams: [pageSize, (pageNumber - 1) * pageSize],
    };
  }

  //function by chatgpt
  function searchJobs(filters) {
    return new Promise((resolve, reject) => {
      const { sql, countSql, params, paginationParams } =
        buildJobSearchQuery(filters);

      // 1. Get total result count (no pagination)
      pool.query(countSql, params, (err, countRows) => {
        if (err) return reject(err);

        const totalResultCount = countRows[0].total;

        // 2. Get paginated results
        pool.query(sql, [...params, ...paginationParams], (err2, jobs) => {
          if (err2) return reject(err2);

          resolve({
            pageNumber: filters.pageNumber,
            pageSize: filters.pageSize,
            totalResultCount,
            pageResultCount: jobs.length,
            jobs,
          });
        });
      });
    });
  }

  // --- Combine everything ---
  let response = {};
  try {
    const jobs = await searchJobs({
      companyName,
      skills,
      pageNumber,
      pageSize,
      includeClosed,
    });

    response = {
      statusCode: 200,
      ...jobs,
    };
  } catch (err) {
    response = {
      statusCode: 400,
      error: err,
    };
  }
  pool.end();
  return response;
};
