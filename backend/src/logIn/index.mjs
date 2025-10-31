export const handler = async (event) => {

  const checkLogin = async (username, password) => {
    // <MOCK> *************************************
    if(username == password){return {credential: username, userType: "applicant"}}
    return {}
    // </MOCK> *************************************
  }

  let response = {}

  try{
    const result = await checkLogin(event.username, event.password)
    
    if(result.credential){
      response = {
        statusCode: 200,
        credential: result.credential,
        userType: result.userType
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
