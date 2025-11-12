import mysql from 'mysql'
export const handler = async (event) => {
  var pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
  });

  let addUser = (username, password, userType) => {
    let add = ''

    if(userType == 'applicant'){
      add = `
        INSERT INTO applicants (applicantname, applicantpassword, credential)
        VALUES (?, ?, UUID())`  
    }else{
      add = `
        INSERT INTO companies (companyName, companypassword, credential)
        VALUES (?, ?, UUID())`
    }
    return new Promise((resolve, reject) => {
        pool.query(add, [username, password], (insertError, rows) => {
            if (insertError) {
              console.error("Database error during insertion:", insertError)
              reject("Database error")
            } else {
              resolve()
            }
        })
    })
  }

  let getCred = (username, userType) => {
      let get = ''
      if(userType == 'applicant'){
        get = `
          SELECT credential, idapplicant FROM applicants WHERE applicantname=?`
      }else{
        get = `
          SELECT credential, idcompanies FROM companies WHERE companyName=?`
      }

    return new Promise((resolve, reject) => {
        pool.query(get, [username], (error, rows) => {
            if (error) {
              console.error("Database error during check:", error)
              reject("Database error")
            } else {
              resolve({credential: rows[0].credential, userType: userType,userID: rows[0].idapplicant})
            }
        })
    })
  }

  let checkDup = (username, userType) => {
    let check = ''
    if(userType == 'applicant'){
      check = `
        SELECT * FROM applicants WHERE applicantname=?`
    }else{
      check = `
        SELECT * FROM companies WHERE companyName=?`
    }

    return new Promise((resolve, reject) => {
        pool.query(check, [username], (error, rows) => {
            if (error) {
              console.error("Database error during check:", error)
              reject("Database error")
            } else {
              resolve(rows.length != 0)
            }
        })
    })
  }

  const registerUser = async (username, password, userType) => {
    const dup = await checkDup(username, userType)
    if(dup){
      return({credential: null})
    }else{
      await addUser(username, password, userType)
      const result = await getCred(username, userType)
      return(result)
    }
  }

  let response = {}

  // try{
    const result = await registerUser(event.username, event.password, event.userType)

    if(result.credential){
      response = {
        statusCode: 200,
        credential: result.credential,
        userType: result.userType,
        userID: result.userID
      }
    }else{
      response = {
        statusCode: 409,
        error: 'User already exists'
      }
    }
  // }catch(err){
  //     response = {
  //       statusCode: 400,
  //       error: err
  //     }
  // }
  return response;
};
