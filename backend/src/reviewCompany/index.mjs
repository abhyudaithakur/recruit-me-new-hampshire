import mysql from 'mysql'
export const handler = async (event) => {
  var pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
  });

  const getData = async (companyName, query) => {
    return new Promise((resolve, reject) => {
      pool.query(query, [companyName], (checkError, rows) => {
          if (checkError) {
            console.error("Database error during data retreival:", checkError)
            reject("Database error during data retreival")
          } else {
            resolve({rows})
          }
      })
    })
  }

  let q_draft = `select jobName from jobs 
    join companies on idcompanies=companyid
    where companyName=? and jobstatus="Draft";`
  let q_open = `
  select jobName, count(applicants_idapplicant) as numApplicants from jobs 
    join jobs_has_applicants on jobs_jobid=jobid 
    join companies on idcompanies=companyid
    where companyName=? and jobstatus="Open"
    group by jobid;`
  let q_closed = `
  select jobName, count(applicant_id) as numHired from jobs 
    join job_offers on jobid=job_id 
	  join companies on idcompanies=companyid
    where companyName=? and jobstatus="Closed" and status="accepted"
    group by jobid;`

  let response = {}

  try{
    const draft = await getData(event.companyName, q_draft)
    const open = await getData(event.companyName, q_open)
    const closed = await getData(event.companyName, q_closed)

    response = {
      statusCode: 200,
      draft: draft,
      open: open,
      closed: closed
    }
  }catch(err){
      response = {
        statusCode: 400,
        error: err
      }
  }
  return response;
};
