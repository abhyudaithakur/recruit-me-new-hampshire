'use client'
import { useRouter } from "next/navigation";
// import { useEffect, useState } from "react";
import { updateCookie, useAuth } from "./AuthProvider";
import { useEffect, useState } from "react";
import axios from "axios";

interface jobItem{
    jobName: string,
    numApplicants: number,
    numHired: number
}

const instance = axios.create({
    baseURL:process.env.NEXT_PUBLIC_API_STAGE
  })

export default function CompanyDashboard() {
    const router = useRouter();
    const allCreds = useAuth()
    const {loading, credential, username, setUserName} =allCreds

    const [editing, setEditing] = useState(false)
    const [load, setLoad] = useState({visibility: 'hidden'} as React.CSSProperties)
    const [err, setErr] = useState('');

    const [draft, setDraft] = useState([] as jobItem[])
    const [open, setOpen] = useState([] as jobItem[])
    const [closed, setClosed] = useState([] as jobItem[])

    const getData = () => {
        instance.post('/reviewCompany', {"companyName":username}).then(function (response) {
            const status = response.data.statusCode;
            setLoad({visibility: 'hidden'})

            if (status == 200) {
                setDraft(response.data.draft.rows)
                setOpen(response.data.open.rows)
                setClosed(response.data.closed.rows)
            }else{
                setErr(response.data.error);
            }

        })
        .catch(function (error: React.SetStateAction<string>) {
            setErr('Error: ' + error);
            setLoad({visibility: 'hidden'})
        })
    }

    useEffect(() => {
        if(!loading){
            if(!credential){
                router.replace('/login')
            }
        }
    })

    useEffect(getData, [username])
    
    
    useEffect(()=>{updateCookie(allCreds)},[allCreds])

    const updateName = () => {
        setEditing(false)

        const name = document.getElementById("username") as HTMLInputElement;
        if(name.value == ''){
            setErr('Invalid name')
            return
        }
    
        setLoad({visibility: 'visible'})
        instance.post('/companyName', {"newName":name.value, "oldName":username}).then(function (response) {
            const status = response.data.statusCode;
            setLoad({visibility: 'hidden'})

            if (status == 200) {
                setUserName(name.value)
            }else{
                setErr(response.data.error);
            }

        })
        .catch(function (error: React.SetStateAction<string>) {
            setErr('failed to register: ' + error);
            setLoad({visibility: 'hidden'})
        })
    }


    return (
        <>
        {editing ? 
            <> <label htmlFor="username">username </label><input type='text' id='username' defaultValue={username}/><button onClick={updateName}>update</button></>: 
            <><h2>Home Page for {username}</h2><button onClick={() => {setEditing(true)}}>edit</button></>
        }

         {/*
         When viewing job applicants use this  V-- axios instance passsesd in so we don't have 50 of them
         // return <ApplicantReview instance={instance} jobID={jobid} jobName={jobname} credentails={allCreds}></ApplicantReview> */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src='/loading-7528_128.gif' alt="" id='loading' style={load}/>
        <label className="error">{err}</label>
        <h3>Inactive Jobs</h3>
        <table>
            <thead>
                <tr>
                    <th>Name</th>
                    <th></th>
                </tr>
            </thead>
            <tbody>
                {draft.map((item) => (
                    <tr key={item.jobName}>
                        <td>{item.jobName}</td>
                        <td><button>edit</button></td>
                        <td><button>open</button></td>
                    </tr>
                ))}
            </tbody>
        </table>
        <h3>Open Jobs</h3>
        <table>
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Applied</th>
                </tr>
            </thead>
            <tbody>
                {open.map((item) => (
                    <tr key={item.jobName}>
                        <td>{item.jobName}</td>
                        <td>{item.numApplicants}</td>
                        <td><button>close</button></td>
                        <td><button>review</button></td>
                    </tr>
                ))}
            </tbody>
        </table>
        <h3>Closed Jobs</h3>
        <table>
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Hired</th>
                </tr>
            </thead>
            <tbody>
                {closed.map((item) => (
                    <tr key={item.jobName}>
                        <td>{item.jobName}</td> 
                        <td>{item.numHired}</td>
                    </tr>
                ))}

            </tbody>
        </table>
        </>
    );
}