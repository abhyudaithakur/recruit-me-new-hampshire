"use client";
import { useAuth } from "@/components/AuthProvider";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { SkillList } from "@/components/SkillList";
import axios from "axios";

const instance = axios.create({
  baseURL: /* "skjdfhskdj" + */ process.env.NEXT_PUBLIC_API_STAGE,
});

export default function Home() {
  const router = useRouter();

  const [username, setUsername] = useState("steve");
  const [skills, setSkills] = useState<string[]>([]);
  const [load, setLoad] = useState({
    visibility: "hidden",
  } as React.CSSProperties);
  const [err, setErr] = useState("");

  const credentials = useAuth();
  useEffect(() => {
    if (!credentials.loading && !credentials.credential) {
      router.push("/login");
    } else if (!credentials.loading && credentials.credential) {
      getSkillsFromDB()
    }
  }, [credentials]);

  function sendSkillChanges() {
    let body = {
      name: username,
      token: credentials.credential,
      userType: credentials.userType,
      skills: skills,
    };
    setLoad({ visibility: "visible" });
    instance
      .post("/editUser", body)
      .then(function (response) {
        const status = response.data.statusCode;
        if (status == 200) {
          setSkills(response.data.skills)
        } else {
          setErr(response.data.error);
          // setLoad({ visibility: "hidden" });
        }
      })
      .catch(function (error: React.SetStateAction<string>) {
        setErr("failed to register: " + error);
        // setLoad({ visibility: "hidden" });
      }).finally(()=>{
        setLoad({ visibility: "hidden" });

      });
  }

  function getSkillsFromDB() {
    let body = {
      name: username,
      token: credentials.credential,
      userType: credentials.userType,
    };
    setLoad({ visibility: "visible" });
    instance
      .post("/getProfileSkills", body)
      .then(function (response) {
        const status = response.data.statusCode;
        if (status == 200) {
          setSkills(response.data.skills)
        } else {
          setErr(response.data.error);
          // setLoad({ visibility: "hidden" });
        }
      })
      .catch(function (error: React.SetStateAction<string>) {
        setErr("failed to register: " + error);
        // setLoad({ visibility: "hidden" });
      }).finally(()=>{
        setLoad({ visibility: "hidden" });

      });
  }

  if (credentials.userType == "Applicant") {
    // get username and skills from db
    // setUsername()
    // setSkills()
  } else if (credentials.userType == "Company") {
  }

  return (
    <>
      <h2>Home Page for {username}</h2>
      <SkillList skills={skills} setSkills={setSkills}></SkillList>
      <button type="submit" onClick={sendSkillChanges}>
        Submit Changes
      </button>
      <img src="/loading-7528_128.gif" alt="" id="loading" style={load} />
    </>
  );
}
