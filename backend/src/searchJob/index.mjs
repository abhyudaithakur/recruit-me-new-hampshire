import mysql from "mysql";

// function updated by chatgpt 
export const handler = async function (event) {
  var pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
  });

  let companyName = event.companyName;
  let skills = event.skills || [];
  let pageNumber = event.pageNumber ?? 1;
  let pageSize = event.pageSize ?? 20;
  let includeClosed = event.includeClosed ? true : false;

  // -----------------------------
  // QUERY BUILDERS
  // -----------------------------

  // FILTERED SEARCH (skills + optional company)
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
    if (!includeClosed) baseWhere += ` AND j.jobstatus = 'open' `;
    else baseWhere += ` AND j.jobstatus IN ('open','closed') `;

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
          WHERE LOWER(inner_s.skills_skillname) IN (${skills.map(() => "?").join(", ")})
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
          SELECT s.jobs_jobid, GROUP_CONCAT(s.skills_skillname) AS skills
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
          SELECT s.jobs_jobid
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

  // ALL JOBS (no skills, no company)
  function searchAllJobs({ pageNumber = 1, pageSize = 20, includeClosed = false }) {
    return new Promise((resolve, reject) => {
      const offset = (pageNumber - 1) * pageSize;

      const statusFilter = includeClosed
        ? ` j.jobstatus IN ('open','closed') `
        : ` j.jobstatus = 'open' `;

      const sql = `
        SELECT 
          j.jobid,
          j.companyid,
          j.jobName,
          c.companyName,
          b.skills,
          j.jobstatus
        FROM jobs j
        LEFT JOIN (
          SELECT s.jobs_jobid, GROUP_CONCAT(s.skills_skillname) AS skills
          FROM jobs_has_skills s
          GROUP BY s.jobs_jobid
        ) b ON j.jobid = b.jobs_jobid
        JOIN companies c ON c.idcompanies = j.companyid
        WHERE ${statusFilter}
        LIMIT ? OFFSET ?
      `;

      const countSql = `
        SELECT COUNT(*) AS total
        FROM jobs j
        WHERE ${statusFilter}
      `;

      pool.query(countSql, [], (err, countRows) => {
        if (err) return reject(err);

        const totalResultCount = countRows[0].total;

        pool.query(sql, [pageSize, offset], (err2, jobs) => {
          if (err2) return reject(err2);

          resolve({
            pageNumber,
            pageSize,
            totalResultCount,
            pageResultCount: jobs.length,
            jobs,
          });
        });
      });
    });
  }

  // ALL JOBS FROM ONE COMPANY (no skills + company)
  function searchAllJobsFromCompany({ pageNumber = 1, pageSize = 20, includeClosed = false, companyName }) {
    return new Promise((resolve, reject) => {
      const offset = (pageNumber - 1) * pageSize;

      const statusFilter = includeClosed
        ? ` j.jobstatus IN ('open','closed') `
        : ` j.jobstatus = 'open' `;

      const sql = `
        SELECT 
          j.jobid,
          j.companyid,
          j.jobName,
          c.companyName,
          b.skills,
          j.jobstatus
        FROM jobs j
        LEFT JOIN (
          SELECT s.jobs_jobid, GROUP_CONCAT(s.skills_skillname) AS skills
          FROM jobs_has_skills s
          GROUP BY s.jobs_jobid
        ) b ON j.jobid = b.jobs_jobid
        JOIN companies c ON c.idcompanies = j.companyid
        WHERE ${statusFilter}
          AND LOWER(c.companyName) LIKE ?
        LIMIT ? OFFSET ?
      `;

      const countSql = `
        SELECT COUNT(*) AS total
        FROM jobs j
        JOIN companies c ON c.idcompanies = j.companyid
        WHERE ${statusFilter}
          AND LOWER(c.companyName) LIKE ?
      `;

      const cnameParam = `%${companyName.toLowerCase()}%`;

      pool.query(countSql, [cnameParam], (err, countRows) => {
        if (err) return reject(err);

        const totalResultCount = countRows[0].total;

        pool.query(sql, [cnameParam, pageSize, offset], (err2, jobs) => {
          if (err2) return reject(err2);

          resolve({
            pageNumber,
            pageSize,
            totalResultCount,
            pageResultCount: jobs.length,
            jobs,
          });
        });
      });
    });
  }

  // FILTERED SEARCH (skills always used)
  function searchJobs(filters) {
    return new Promise((resolve, reject) => {
      const { sql, countSql, params, paginationParams } =
        buildJobSearchQuery(filters);

      pool.query(countSql, params, (err, countRows) => {
        if (err) return reject(err);

        const totalResultCount = countRows[0].total;

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


  // -----------------------------
  // MAIN LOGIC
  // -----------------------------

  let response = {};
  try {
    const skillsEmpty = !skills || skills.length === 0;
    const companyEmpty = !companyName || companyName.trim() === "";

    let result;

    if (skillsEmpty && companyEmpty) {
      // → ALL JOBS
      result = await searchAllJobs({ pageNumber, pageSize, includeClosed });

    } else if (skillsEmpty && !companyEmpty) {
      // → ALL JOBS FROM COMPANY
      result = await searchAllJobsFromCompany({
        pageNumber,
        pageSize,
        includeClosed,
        companyName,
      });

    } else {
      // → SKILL SEARCH (skills with or without company)
      result = await searchJobs({
        companyName,
        skills,
        pageNumber,
        pageSize,
        includeClosed,
      });
    }
    result.jobs.map(x=>{let l = x; if(l.skills==null){l.skills=""}return l})
    response = {
      statusCode: 200,
      ...result,
    };

  } catch (err) {
    response = { statusCode: 400, error: err };
  }

  pool.end();
  return response;
};


console.log(await handler({
    companyName: "n",
    skills: [],
    pageNumber: 1,
    pageSize: 2,
    includeClosed: true,
  }))