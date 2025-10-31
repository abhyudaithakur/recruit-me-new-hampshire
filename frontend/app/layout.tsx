'use client' 

import "./globals.css";
import Link from "next/link";
import TestBut from "../components/testbut";
import AuthProvider, { useAuth } from "../components/AuthProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  const { credential, setCredential, setUserType } = useAuth()

  return (
    <html lang="en">
      <AuthProvider>
        <body>
          <nav className="bg-blue-500 flex justify-center gap-4 fixed top-0 right-0 left-0 z-10">
            <Link href="/">Home</Link>
            <Link href='/login' className="header-button" onClick={() => {
              alert(credential)
            if(credential){
              document.cookie='credential='
              document.cookie='userType='
              setCredential('')
              setUserType('')
            }
            }}>
            {credential ? 'Log Out' : 'Log In'}
            </Link>
            {/* TODO: Remove later */}
            <TestBut></TestBut> 
          </nav>
          {children}
        </body>
      </AuthProvider>
    </html>
  );
}
