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
        "SELECT idcompanies FROM companies WHERE companyName = ? and credential = ?",
        [name, credential],
        (error, rows) => {
          if (error) {
            // console.log("chek", error);
            reject("Database error" + error);
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

      // convert callback API to promise
      pool.getConnection((err, conn) => {
        if (err) return reject(err);

        conn.beginTransaction(async (err) => {
          if (err) {
            conn.release();
            return reject(err);
          }

          try {
            // Create temp table
            await new Promise((res, rej) =>
              conn.query(
                `CREATE TEMPORARY TABLE tmp_applicant_updates (
                  applicantid INT,
                  status VARCHAR(100)
                )`,
                (e) => (e ? rej(e) : res())
              )
            );

            // Insert rows
            const values = applicants.map((a) => [a.id, a.status]);

            await new Promise((res, rej) =>
              conn.query(
                "INSERT INTO tmp_applicant_updates (applicantid, status) VALUES ?",
                [values],
                (e) => (e ? rej(e) : res())
              )
            );

            // Update join
            await new Promise((res, rej) =>
              conn.query(
                `
                  UPDATE jobs_has_applicants AS j
                  JOIN tmp_applicant_updates AS t
                  ON j.applicants_idapplicant = t.applicantid
                  SET j.status_statusType = t.status
                  WHERE j.jobs_jobid = ?
                `,
                [jobid],
                (e) => (e ? rej(e) : res())
              )
            );

            // Commit
            await new Promise((res, rej) =>
              conn.commit((e) => (e ? rej(e) : res()))
            );

            conn.release();
            resolve({ success: true, updated: applicants.length });
          } catch (error) {
            conn.rollback(() => {
              conn.release();
              reject(error);
            });
          }
        });
      });
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
    let resp = await editApplicantReadiness(jobid, applicants);
    if (resp.success) {
      return { code: 200, length: resp.updated };
    } else {
      return { code: 400, message: "Something whet wrong" };
    }
  }

  let result = await dochanges(event);

  let response = {};
  if (result.code == 200) {
    response = {
      statusCode: 200,
      success: true,
    };
  } else {
    response = {
      statusCode: result.code,
      error: result.message ? result.message : result,
    };
  }
  return response;
};
