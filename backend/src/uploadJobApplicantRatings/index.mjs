import mysql from "mysql";
export const handler = async (event) => {
  var pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
  });

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

  //function by chatgpt
  function editApplicantReadiness(jobid, applicants) {
    return new Promise((resolve, reject) => {
      if (!Array.isArray(applicants) || applicants.length === 0) {
        return reject("Applicant list is empty");
      }

      const connectionPromise = pool.getConnection();

      connectionPromise
        .then((conn) => {
          // Use a transaction for safety
          conn.beginTransaction(async (err) => {
            if (err) {
              conn.release();
              return reject(err);
            }

            try {
              // temp table -- removed when connection closes
              await conn.query(`
              CREATE TEMPORARY TABLE tmp_applicant_updates (
                applicantid INT,
                status VARCHAR(100)
              );
            `);

              // insert date to temp table
              const values = applicants.map((a) => [a.id, a.status]);
              await conn.query(
                "INSERT INTO tmp_applicant_updates (applicantid, status) VALUES ?",
                [values]
              );

              // join for batch op
              await conn.query(
                `
              UPDATE jobs_has_applicants AS j
              JOIN tmp_applicant_updates AS t
                ON j.applicants_idapplicant = t.applicantid
              SET j.status = t.status
              WHERE j.jobid = ?;
              `,
                [jobid]
              );

              // commit
              await conn.commit();
              conn.release();

              resolve({ success: true, updated: applicants.length });
            } catch (error) {
              await conn.rollback();
              conn.release();
              reject(error);
            }
          });
        })
        .catch((err) => reject(err));
    });
  }

  async function dochanges(event) {
    const { jobid, companyName, companyCredential, applicants } = event;
    let checkResp = await checkCredentials(companyName, companyCredential);
    if (!checkResp.valid) {
      return { code: 401, message: "Not Authorized" };
    }
    let checkvalidPair = await checkValidCompanyForJob(jobid, checkResp.id);
    if (!checkvalidPair.valid) {
      return { code: 401, message: "Not Authorized" };
    }
    let resp = editApplicantReadiness(jobid, applicants);
    if (resp.success) {
      return { code: 200, length: resp.updated };
    } else {
      return { code: 400, message: "Something whet wrong" };
    }
  }

  let result = await editSkills(event);

  let response = {};
  if (result.code == 200) {
    response = {
      statusCode: 200,
      success: true,
    };
  } else {
    response = {
      statusCode: result.code,
      error: result.message,
    };
  }
  return response;
};
