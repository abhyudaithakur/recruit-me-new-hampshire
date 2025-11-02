"use client";
import axios from "axios";
import { useState } from "react";

interface jobDescription {
  jobName: string;
  companyName: string;
  skills: string[];
}

const temp: jobDescription[] = [
  { jobName: "1", companyName: "2", skills: ["3", "4", "5"] },
  { jobName: "1", companyName: "2", skills: ["3", "4", "5"] },
  { jobName: "1", companyName: "2", skills: ["3", "4", "5"] },
  { jobName: "1", companyName: "2", skills: ["3", "4", "5"] },
  { jobName: "1", companyName: "2", skills: ["3", "4", "5"] },
  { jobName: "1", companyName: "2", skills: ["3", "4", "5"] },
];

const instance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_STAGE,
});

export default function search() {
  const [jobs, setJobs] = useState<jobDescription[]>(temp);
  const [load, setLoad] = useState({
    visibility: "hidden",
  } as React.CSSProperties);
  const [err, setErr] = useState("");
  const pageSize = 10;
  const [pageNumber, setPageNumber] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(0);

  //   setJobs(temp)

  function searchJobs(search: {
    compName: string;
    skill: string;
    page: number;
    pageSize: number;
  }) {
    let body = {
      companName: search.compName,
      skill: search.skill,
      page: search.page,
      pageSize: search.pageSize,
    };
    setLoad({ visibility: "visible" });
    instance
      .post("/TODO", body)
      .then(function (response) {
        const status = response.data.statusCode;
        if (status == 200) {
          setJobs(response.data.jobs);
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

  return (
    <>
      <style>
        {`
        // tr {line-height:1em;}
        table, th, td {border:1px solid;}
        // th {width:300px;}
        // td {padding-left:.5em; padding-right:1em}
        // td:first-child { min-width:200px; max-width: 200px; overflow-x:wrap;}
        `}
      </style>

      <h1>Search</h1>
      <form action="" method="post">
        <input placeholder="Company Name" type="text" />
        <input placeholder="Skill" type="text" />
        <button type="submit">Go</button>
      </form>

      <div>
        <table>
          <thead>
            <tr>
              <th>Company</th>
              <th>Job</th>
              <th>Skills</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((x, i) => {
              return (
                <tr key={i}>
                  <td>{x.companyName}</td>
                  <td>{x.jobName}</td>
                  <td>
                    <p>
                      {x.skills.reduce((x, c, id) => {
                        return id == 0 ? c : x + ", " + c;
                      }, "")}
                    </p>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <th colSpan={3}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "100px 100px 100px",
                    gap: "1em",
                    justifyContent: "center",
                  }}>
                  {pageNumber > 0 ? (
                    <button type="button">{"←"}</button>
                  ) : (
                    <></>
                  )}
                  <p style={{ textAlign: "center", gridColumn: 2 }}>
                    {" "}
                    Page {pageNumber + 1} of {totalPages + 1}{" "}
                  </p>
                  {pageNumber < totalPages ? (
                    <button type="button">{"→"}</button>
                  ) : (
                    <></>
                  )}
                </div>
              </th>
            </tr>
          </tfoot>
        </table>
      </div>
    </>
  );
}
