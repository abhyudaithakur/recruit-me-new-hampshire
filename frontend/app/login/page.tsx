'use client'
import React, { FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useAuth } from '@/components/AuthProvider';

const instance = axios.create({
    baseURL:process.env.NEXT_PUBLIC_API_STAGE
  })

const Login: React.FC = () => {
  const router = useRouter()
  const [load, setLoad] = React.useState({visibility: 'hidden'} as React.CSSProperties)
  const [err, setErr] = React.useState('');

  const { setCredential, setUserType } = useAuth()

  const handleLogin = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const username = document.getElementById("username") as HTMLInputElement;
    const password = document.getElementById("password") as HTMLInputElement;
    setLoad({visibility: 'visible'})
    instance.post('/login', {"username":username.value, "password":password.value}).then(function (response) {
      const status = response.data.statusCode;

        // <MOCK> ***********************************************
        //   document.cookie = 'credential=' + '12345'
        //   setCredential('username')
        //   document.cookie='userType=' + 'applicant'
        //   setUserType(response.data.userType)
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
        setErr('failed to log in: ' + error);
        setLoad({visibility: 'hidden'})
    })
  };

  
  return(
    <div className='content'>
        <h2>Log In</h2>
        <form onSubmit={handleLogin}>
          <input id='username' placeholder='Username'/>
          <input id='password' placeholder='Password' type='password'/>
          <button type="submit">Log In</button>
          {/*eslint-disable-next-line @next/next/no-img-element*/}
          <img src='/loading-7528_128.gif' alt="" id='loading' style={load}/>
          <label className="error">{err}</label>
        </form>
        <a href='/signup'>Don&apos;t have an account? Sign Up!</a>
    </div>
  );
}


export default Login;