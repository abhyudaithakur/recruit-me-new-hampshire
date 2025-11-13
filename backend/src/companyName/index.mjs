import mysql from 'mysql'
export const handler = async (event) => {
  var pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
  });

  const updateName = async (newName, oldName) => {
    const check = `
        UPDATE companies SET companyName=? WHERE companyName=?`

    return new Promise((resolve, reject) => {
      pool.query(check, [newName, oldName], (checkError) => {
          if (checkError) {
            console.error("Database error during update:", checkError)
            reject("Database error during update")
          } else {
            resolve({newName: newName})
          }
      })
    })
  }

  let response = {}

  try{
    const result = await updateName(event.newName, event.oldName)
    
    if(result.newName == event.newName){
      response = {
        statusCode: 200
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
