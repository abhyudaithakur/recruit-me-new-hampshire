'use client'
import React, { FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useAuth } from '@/components/AuthProvider';

const instance = axios.create({
    baseURL:process.env.NEXT_PUBLIC_API_STAGE
  })

const SignUp: React.FC = () => {
  const router = useRouter();
  const [load, setLoad] = React.useState({visibility: 'hidden'} as React.CSSProperties)
  const [err, setErr] = React.useState('');

  const { setCredential, setUserType } = useAuth()

  const handleSignup = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const username = document.getElementById("username") as HTMLInputElement;
    const password = document.getElementById("password") as HTMLInputElement;
    const verify = document.getElementById("verify-password") as HTMLInputElement;

    if(password.value != verify.value){
      setErr('Passwords do not match!')
      return
    }

    setLoad({visibility: 'visible'})
    instance.post('/signup', {"username":username.value, "password":password.value}).then(function (response) {
      const status = response.data.statusCode;

      // <MOCK> ***********************************************
      // document.cookie = 'credential=' + '12345'
      // setCredential('username')
      // document.cookie='userType=' + 'applicant'
      // setUserType(response.data.userType)
      // </MOCK> ***********************************************

      if (status == 200) {
        document.cookie = 'credential=' + response.data.credential
        setCredential(response.data.credential)
        document.cookie='userType=' + response.data.userType
        setUserType(response.data.userType)
        router.push('/')
      }else{
        setErr(response.data.error);
        setLoad({visibility: 'hidden'})
      }
    })
    .catch(function (error: React.SetStateAction<string>) {
        setErr('failed to register: ' + error);
        setLoad({visibility: 'hidden'})
    })
  };

  const checkPass = () => {
    const password = document.getElementById("password") as HTMLInputElement;
    const verify = document.getElementById("verify-password") as HTMLInputElement;

    if(password.value != verify.value){
      setErr("Passwords do not match!")
    }else{
      setErr("")
    }

  }
  
  return(
    <div className='content'>
        <h2>Sign Up</h2>
        <form onSubmit={handleSignup}>
          <input id='username' placeholder='Username'/>
          <input id='password' placeholder='Password' type='password'/>
          <input id='verify-password' placeholder='Verify password' type='password'onChange={checkPass}/>
          <button type="submit">Sign Up</button>
          {/*eslint-disable-next-line @next/next/no-img-element*/}
          <img src='/loading-7528_128.gif' alt="" id='loading' style={load}/>
          <label className="error">{err}</label>
        </form>
        <a href='/signup'>Already have an account? Log In!</a>
    </div>
  );
}


export default SignUp;