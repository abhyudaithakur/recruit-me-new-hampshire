'use client'
import { createContext, Dispatch, SetStateAction, useContext, useEffect, useState } from "react";

interface IAuthContext{
    credential: string
    setCredential: Dispatch<SetStateAction<string>>,
    loading: boolean,
    userType: string,
    setUserType: Dispatch<SetStateAction<string>>,
}

const AuthContext = createContext<IAuthContext>({
    credential: '',
    setCredential: () => {},
    loading: true,
    userType: '',
    setUserType: () => {}
})

export const useAuth = () => useContext(AuthContext)

const AuthProvider = ({ children }: Readonly<{children: React.ReactNode}>) => {
    const [credential, setCredential] = useState('')
    const [loading, setLoading] = useState(true)
    const [userType, setUserType] = useState('')

    useEffect(() => {
        const cred = document.cookie.split("; ").find((row) => row.startsWith("credential="))?.split("=")[1];
        const ut = document.cookie.split("; ").find((row) => row.startsWith("userType="))?.split("=")[1];
        if(cred){
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setCredential(cred)
            setUserType(ut ? ut : 'applicant')
        }else{
            setCredential('')
            setUserType('')
        }
        setLoading(false)
    }, [])

    return(
        <AuthContext.Provider value={{ credential, setCredential, loading, userType, setUserType}}>
          {children}
        </AuthContext.Provider>
    );
}

export default AuthProvider