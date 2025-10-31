'use client' 

import "./globals.css";
import Link from "next/link";
import AuthProvider, { useAuth } from "../components/AuthProvider";
import LogInOut from "@/components/LogInOut";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html lang="en">
      <AuthProvider>
        <body>
          <nav>
            <Link href={'/'}>Home</Link>
            <span> | </span>
            <LogInOut/>
          </nav>
          {children}
        </body>
      </AuthProvider>
    </html>
  );
}
