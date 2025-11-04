'use client'
import { createContext, Dispatch, SetStateAction, useContext, useEffect, useState } from "react";

interface IAuthContext{
    credential: string
    setCredential: Dispatch<SetStateAction<string>>,
    loading: boolean,
    userType: string,
    setUserType: Dispatch<SetStateAction<string>>,
    username: string,
    setUserName:Dispatch<SetStateAction<string>>
    userID: string,
    setUserID:Dispatch<SetStateAction<string>>
}

const AuthContext = createContext<IAuthContext>({
    credential: '',
    setCredential: () => {},
    loading: true,
    userType: '',
    setUserType: () => {},
    username: '',
    setUserName: ()=>{},
    userID: '',
    setUserID: ()=>{}
})

export const useAuth = () => useContext(AuthContext)

const AuthProvider = ({ children }: Readonly<{children: React.ReactNode}>) => {
    const [credential, setCredential] = useState('')
    const [loading, setLoading] = useState(true)
    const [userType, setUserType] = useState('')
    const [username, setUserName] = useState('')
    const [userID, setUserID] = useState('')

    useEffect(() => {
        const cred = document.cookie.split("; ").find((row) => row.startsWith("credential="))?.split("=")[1];
        const ut = document.cookie.split("; ").find((row) => row.startsWith("userType="))?.split("=")[1];
        const un = document.cookie.split("; ").find((row) => row.startsWith("username="))?.split("=")[1];
        const uid = document.cookie.split("; ").find((row) => row.startsWith("userID="))?.split("=")[1];
        console.log(uid)
        if(cred){
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setCredential(cred)
            setUserType(ut ? ut : 'applicant')
            setUserName(un? un : 'EMPTY')
            setUserID(uid? uid : '-1')
        }else{
            setCredential('')
            setUserType('')
            setUserName('')
            setUserID('')
        }
        setLoading(false)
    }, [])

    return(
        <AuthContext.Provider value={{ credential, setCredential, loading, userType, setUserType,username,setUserName,userID, setUserID}}>
          {children}
        </AuthContext.Provider>
    );
}

export default AuthProvider