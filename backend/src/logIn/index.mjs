import mysql from 'mysql'
export const handler = async (event) => {
  var pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
  });

  const checkLogin = async (username, password, userType) => {
    let check = ''
    if(userType == 'applicant'){
      check = `
        SELECT credential, idapplicant FROM applicants WHERE applicantname=? and applicantpassword=?`
    }else{
      check = `
        SELECT credential, idcompanies FROM companies WHERE companyName=? and companypassword=?`
    }
    

    return new Promise((resolve, reject) => {
      pool.query(check, [username, password], (checkError, rows) => {
          if (checkError) {
            console.error("Database error during login:", checkError)
            reject("Database error during login")
          } else {
            resolve({credential: rows, userType: userType})
          }
      })
    })
    // <MOCK> *************************************
    // if(username == password){return {credential: username, userType: "applicant"}}
    // return {}
    // </MOCK> *************************************
  }

  let response = {}

  try{
    const result = await checkLogin(event.username, event.password, event.userType)
    
    if(result.credential.length != 0){
      response = {
        statusCode: 200,
        credential: result.credential[0].credential,
        userType: result.userType,
        userID: result.userType === "applicant" ? result.credential[0].idapplicant : result.credential[0].idcompanies
      }
    }else{
      response = {
        statusCode: 401,
        error: 'Invalid credentials'
      }
    }
  }catch(err){
      response = {
        statusCode: 400,
        error: err
      }
  }
  return response;
};
