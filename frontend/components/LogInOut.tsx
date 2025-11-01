import Link from "next/link"
import { useAuth } from "./AuthProvider"

const LogInOut = () => {
    const { credential, setCredential, setUserType } = useAuth()
    return(
        <Link href='/login' onClick={() => {
            if(credential){
                document.cookie='credential='
                document.cookie='userType='
                setCredential('')
                setUserType('')
            }}}>
            {credential ? 'Log Out' : 'Log In'}
        </Link>
    )
}

export default LogInOut