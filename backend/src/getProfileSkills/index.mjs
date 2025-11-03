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
        "SELECT idapplicant FROM applicants WHERE applicantname=? and credential=?",
        [name, credential],
        (error, rows) => {
          if (error) {
            // console.log("chek", error);
            reject("Database error");
          } else {
            // console.log("chek", rows);
            resolve({ valid: rows.length != 0, id: rows[0]?rows[0].idapplicant:-1 });
          }
        }
      );
    });
  }

  function deleteApplicantSkills(id) {
    return new Promise((resolve, reject) => {
      pool.query(
        "DELETE FROM applicants_has_skills WHERE applicants_idapplicant=?",
        [id],
        (error, rows) => {
          if (error) {
            // console.log("del", error);
            reject("Database error");
          } else {
            // console.log("del", rows);
            resolve({ valid: rows.OkPacket !=null });
          }
        }
      );
    });
  }

  function insertApplicantSkills(id, skills) {
    return new Promise((resolve, reject) => {
      pool.query(
        "INSERT INTO applicants_has_skills VALUES ?",
        [skills.map((x) => [id, x])],
        (error, rows) => {
          if (error) {
            // console.log("ins", error);
            reject("Database error");
          } else {
            // console.log("ins", rows);
            resolve({ valid: rows.OkPacket !=null });
          }
        }
      );
    });
  }

  function getApplicantSkills(id) {
    return new Promise((resolve, reject) => {
      pool.query(
        "SELECT skills_skillname FROM applicants_has_skills WHERE applicants_idapplicant=?",
        [id],
        (error, rows) => {
          if (error) {
            // console.log("get", error);

            reject("Database error");
          } else {
            // console.log("get", rows);

            resolve({ rows: rows });
          }
        }
      );
    });
  }

  function addSkillsToSkillTable(skills) {
    return new Promise((resolve, reject) => {
      pool.query(
        `INSERT IGNORE INTO skill (skillname) VALUES ?`,
        [skills.map((x) => [x])],
        (error, rows) => {
          if (error) {
            // console.log("ski", error);
            reject("Database error");
          } else {
            // console.log("ski", rows);
            resolve({ valid: true });
          }
        }
      );
    });
  }

  async function getSkills(event) {
    const { name, token, skills, userType } = event;
    let checkResp = await checkCredentials(name, token);
    if (!checkResp.valid) {
      return { code: 401, message: "Not Authorized" };
    }
    let id = checkResp.id
    let { rows } = await getApplicantSkills(id);
    let presentSkills = rows.map((x) => x.skills_skillname);
    return { code: 200, skills: presentSkills };
  }

  let result = await getSkills(event);

  let response = {};
  if (result.code == 200) {
    response = {
      statusCode: 200,
      skills: result.skills,
      userType: "Applicant",
    };
  } else {
    response = {
      statusCode: result.code,
      error: result.message,
    };
  }
  return response;
};