"use client";
import axios from "axios";
import { on } from "events";
import { FormEvent, useState } from "react";

interface jobDescription {
  jobName: string;
  companyName: string;
  jobStatus: "Open" | "Closed";
  skills: string[];
}

// const temp: jobDescription[] = [
//   {
//     jobName: "1",
//     companyName: "2",
//     jobStatus: "Open",
//     skills: ["3", "4", "5"],
//   },
//   {
//     jobName: "1",
//     companyName: "2",
//     jobStatus: "Open",
//     skills: ["3", "4", "5"],
//   },
//   {
//     jobName: "1",
//     companyName: "2",
//     jobStatus: "Open",
//     skills: ["3", "4", "5"],
//   },
//   {
//     jobName: "1",
//     companyName: "2",
//     jobStatus: "Open",
//     skills: ["3", "4", "5"],
//   },
//   {
//     jobName: "1",
//     companyName: "2",
//     jobStatus: "Open",
//     skills: ["3", "4", "5"],
//   },
//   {
//     jobName: "1",
//     companyName: "2",
//     jobStatus: "Open",
//     skills: ["3", "4", "5"],
//   },
// ];

const instance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_STAGE,
});

export default function search() {
  const [jobs, setJobs] = useState<jobDescription[]>([]);
  const [load, setLoad] = useState({
    visibility: "hidden",
  } as React.CSSProperties);
  const [err, setErr] = useState("");
  const pageSize = 2;
  const [pageNumber, setPageNumber] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [searchName, setSearchName] = useState<string|null>(null);
  const [searchSkills, setSearchSkills] = useState<string[]>([]);

  function onSearch(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const comanyName = (
      document.getElementById("CompanyName") as HTMLInputElement
    ).value;
    const skillString = (document.getElementById("Skills") as HTMLInputElement)
      .value;
    let companyName = comanyName.length > 0 ? comanyName : null;
    setSearchName(companyName)
    let skilllist = skillString.split(",").filter((x) => x.length > 0);
    setSearchSkills(skilllist)

    searchJobs({
      compName: companyName,
      skills: skilllist,
      page: 1,
      pageSize: pageSize,
      includeClosed: true,
    });
  }

  function onPage(up: boolean) {
    searchJobs({
      compName: searchName,
      skills: searchSkills,
      page: pageNumber + 1 + (up ? 1 : -1),
      pageSize: pageSize,
      includeClosed: true,
    });
  }

  function searchJobs(search: {
    compName: string | null;
    skills: string[];
    page: number;
    pageSize: number;
    includeClosed: boolean;
  }) {
    let body = {
      companyName: search.compName,
      skills: search.skills,
      pageNumber: search.page,
      pageSize: search.pageSize,
      includeClosed: search.includeClosed,
    };
    setLoad({ visibility: "visible" });
    instance
      .post("/searchJob", body)
      .then(function (response) {
        const status = response.data.statusCode;
        if (status == 200) {
          setPageNumber(response.data.pageNumber - 1);
          setTotalPages(
            Math.max(0,Math.ceil(response.data.totalResultCount / response.data.pageSize)-1)
          );
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
      <form onSubmit={onSearch} method="post">
        <input id="CompanyName" placeholder="Company Name" type="text" />
        <input id="Skills" placeholder="Skill, Other Skill" type="text" />
        <button type="submit">Go</button>
        <img src='/loading-7528_128.gif' alt="" id='loading' style={load}/>
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
                    <button onClick={() => onPage(false)} type="button">
                      {"←"}
                    </button>
                  ) : (
                    <></>
                  )}
                  <p style={{ textAlign: "center", gridColumn: 2 }}>
                    {" "}
                    Page {pageNumber + 1} of {totalPages+1}{" "}
                  </p>
                  {pageNumber < totalPages ? (
                    <button onClick={() => onPage(true)} type="button">
                      {"→"}
                    </button>
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
