export const handler = async (event) => {

  const registerUser = async (username, password) => {
    // <MOCK> *************************************
    if(username == password){return {credential: username, userType: "applicant"}}
    return {}
    // </MOCK> *************************************
  }

  let response = {}

  try{
    const result = await registerUser(event.username, event.password)

    if(result.credential){
      response = {
        statusCode: 200,
        credential: result.credential,
        userType: result.userType
      }
    }else{
      response = {
        statusCode: 409,
        error: 'User already exists'
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
