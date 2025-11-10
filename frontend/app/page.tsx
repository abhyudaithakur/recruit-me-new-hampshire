"use client";

import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import axios from "axios";
import ApplicantDashboard from "@/components/ApplicantDashboard";

const instance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_STAGE,
});


export default function Home() {
  const router = useRouter();

  const credentials = useAuth();


  // get skills
  useEffect(() => {
    if (!credentials.loading && !credentials.credential) {
      router.push("/login");
    }
  }, [credentials]);
  
  if (credentials.userType == "applicant") {
    return <ApplicantDashboard credentials={credentials}></ApplicantDashboard>
  } else if (credentials.userType == "company") {
  } else{
    return <><h1>Please Wait</h1></>
  }

 
}
