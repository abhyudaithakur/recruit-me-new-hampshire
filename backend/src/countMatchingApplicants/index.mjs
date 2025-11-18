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
  }) {
    const params = [];


    // Skills filter
    let skillsFilter = "";
    if (skills.length > 0) {
      skillsFilter = `
      WHERE s.applicants_idapplicant IN (
        SELECT inner_s.applicants_idapplicant
        FROM applicants_has_skills inner_s
        WHERE LOWER(inner_s.skills_skillname) IN (${skills
          .map(() => "?")
          .join(", ")})
        GROUP BY inner_s.applicants_idapplicant
        HAVING COUNT(DISTINCT LOWER(inner_s.skills_skillname)) = ?
      )
    `;
      for (const skill of skills) params.push(skill.toLowerCase());
      params.push(skills.length);
    }


    const countSql = `
    SELECT COUNT(*) AS total
    FROM applicants j
    JOIN (
        SELECT 
          s.applicants_idapplicant
        FROM applicants_has_skills s
        ${skillsFilter}
        GROUP BY s.applicants_idapplicant
    ) b ON j.idapplicant = b.applicants_idapplicant
  `;

    return {
      countSql,
      params,
    };
  }

  //function by chatgpt
  function searchJobs(filters) {
    return new Promise((resolve, reject) => {
      const { countSql, params} =
        buildJobSearchQuery(filters);

      // 1. Get total result count (no pagination)
      pool.query(countSql, params, (err, countRows) => {
        if (err) return reject(err);

        const totalResultCount = countRows[0].total;
        resolve({
          totalResultCount,
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

console.log(await handler({skills:[]}))