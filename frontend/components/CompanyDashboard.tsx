'use client'
import { useRouter } from "next/navigation";
// import { useEffect, useState } from "react";
import { useAuth } from "./AuthProvider";
import { useEffect, useState } from "react";
import axios from "axios";

const instance = axios.create({
    baseURL:process.env.NEXT_PUBLIC_API_STAGE
  })

export default function CompanyDashboard() {
    const router = useRouter();

    const {loading, credential, username, setUserName} = useAuth()

    const [editing, setEditing] = useState(false)
    const [load, setLoad] = useState({visibility: 'hidden'} as React.CSSProperties)
    const [err, setErr] = useState('');

    useEffect(() => {
        if(!loading){
            if(!credential){
                router.replace('/login')
            }else{

            }
        }
    })
    
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
            <><input type='text' id='username' defaultValue={username}/><button onClick={updateName}>update</button></>: 
            <><h2>Home Page for {username}</h2><button onClick={() => {setEditing(true)}}>edit</button></>
        }
        {/*eslint-disable-next-line @next/next/no-img-element*/}
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
                <tr>
                    <td>eatery</td>
                    <td><button>edit</button></td>
                    <td><button>open</button></td>
                </tr>
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
                <tr>
                    <td>Ear</td>
                    <td>3</td>
                    <td><button>close</button></td>
                    <td><button>review</button></td>
                </tr>
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
                <tr>
                    <td>head of cabbage</td>
                    <td>2</td>
                </tr>
            </tbody>
        </table>
        </>
    );
}