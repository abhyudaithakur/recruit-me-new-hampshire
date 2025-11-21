import { Axios } from "axios";
import { FormEvent, useState } from "react";

export default function CountMatchingApplicants({
  instance,
}: {
  instance: Axios;
}) {
  const [load, setLoad] = useState({
    visibility: "hidden",
  } as React.CSSProperties);
  const [err, setErr] = useState("");

  const [number, setNumber] = useState("");

  function countApplicants(skills: string[]) {
    const body = {
      skills: skills,
    };
    setLoad({ visibility: "visible" });
    instance
      .post("/countMatchingApplicants", body)
      .then(function (response) {
        const status = response.data.statusCode;
        if (status == 200) {
          setNumber("" + response.data.totalResultCount);
        } else {
          setErr(response.data.error);
        }
      })
      .catch(function (error: React.SetStateAction<string>) {
        setErr("failed to get jobs: " + error);
      })
      .finally(() => {
        setLoad({ visibility: "hidden" });
      });
  }

  function search(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const skillString = (document.getElementById("Skills") as HTMLInputElement)
      .value;
    const skilllist = skillString.split(",").filter((x) => x.length > 0);
    countApplicants(skilllist);
  }

  return (
    <>
      <p>Check Number of applicants with a set of skills</p>
      <form onSubmit={search} action="" method="post">
        <label htmlFor="skills">Skills</label>
        <input type="text" placeholder="skill1, skill2" />
        <button type="submit">Check</button>
        <img src="/loading-7528_128.gif" alt="" id="loading" style={load} />
      </form>
      {number.length > 0 ? (
        <p>There are {number} applicant(s) with those skills</p>
      ) : (
        <></>
      )}
    </>
  );
}
