import { Axios } from "axios";
import { ChangeEvent, useEffect, useState } from "react";
import { IAuthContext } from "./AuthProvider";

interface ApplicantData {
  name: string;
  id: number;
  skills: string[];
  status: string;
}

let timeoutHandle = 0;
export default function ApplicantTable({
  jobID,
  TableName,
  pageSize,
  instance,
  status,
  credentails,
}: {
  jobID: number;
  TableName: String;
  pageSize: number;
  instance: Axios;
  status: string;
  credentails: IAuthContext;
}) {
  const [applicants, setApplicants] = useState<ApplicantData[]>([]);
  const [load, setLoad] = useState({
    visibility: "hidden",
  } as React.CSSProperties);
  const [err, setErr] = useState("");
  const [pageNumber, setPageNumber] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(0);

  useEffect(() => {
    searchApplicants({
      jobid: jobID,
      page: 1,
      pageSize: pageSize,
      status: status,
    });
  }, []);

  function searchApplicants(search: {
    jobid: number;
    page: number;
    pageSize: number;
    status: string;
  }) {
    const body = {
      jobid: jobID,
      pageNumber: search.page,
      pageSize: search.pageSize,
      status: search.status,
      companyName: credentails.username,
      companyCredential: credentails.credential,
    };

    setLoad({ visibility: "visible" });

    instance
      .post("/searchJobApplicants", body)
      .then(function (response) {
        const status = response.data.statusCode;
        if (status == 200) {
          setPageNumber(response.data.pageNumber - 1);
          setTotalPages(
            Math.max(
              0,
              Math.ceil(
                response.data.totalResultCount / response.data.pageSize
              ) - 1
            )
          );
          setApplicants(response.data.applicants);
        } else {
          setErr(response.data.error);
        }
      })
      .catch(function (error: React.SetStateAction<string>) {
        setErr("failed to get applicants: " + error);
      })
      .finally(() => {
        setLoad({ visibility: "hidden" });
      });
  }

  function uploadRatings() {
    const body = {
      companyName: credentails.username,
      companyCredential: credentails.credential,
      jobid: jobID,
      applicants: applicants.map((x) => {
        return { id: x.id, status: x.status };
      }),
    };

    setLoad({ visibility: "visible" });

    instance
      .post("/uploadJobApplicantRatings", body)
      .then(function (response) {
        const status = response.data.statusCode;
        if (status == 200) {
          searchApplicants({
            jobid: jobID,
            page: 1,
            pageSize: pageSize,
            status: status,
          });
        } else {
          setErr(response.data.error);
        }
      })
      .catch(function (error: React.SetStateAction<string>) {
        setErr("failed to upload applicants: " + error);
      })
      .finally(() => {
        setLoad({ visibility: "hidden" });
      });
  }
  let timeoutHandle = 0;
  function sendChange(forceChange: boolean) {
    if (timeoutHandle > 0) {
      clearTimeout(timeoutHandle);
      timeoutHandle = 0;
    }
    if (!forceChange) {
      timeoutHandle = window.setTimeout(uploadRatings, 5000);
    } else {
      uploadRatings();
    }
  }
  function changeRating(e: ChangeEvent<HTMLSelectElement>, index: number) {
    let a = applicants.slice();
    a[index].status = e.target.value;
    setApplicants(a);
    sendChange(false);
  }

  function onPage(up: boolean) {
    sendChange(true);
    searchApplicants({
      jobid: jobID,
      page: pageNumber + 1 + (up ? 1 : -1),
      pageSize: pageSize,
      status: status,
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
      <table>
        <thead>
          <tr>
            <th colSpan={3}>{TableName}</th>
          </tr>
          <tr>
            <th>Name</th>
            <th>Skills</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {applicants.map((x, i) => {
            return (
              <tr key={i}>
                <td>{x.name}</td>
                <td>
                  <p>
                    {x.skills.reduce((x, c, id) => {
                      return id == 0 ? c : x + ", " + c;
                    }, "")}
                  </p>
                </td>
                <td>
                  <label htmlFor="ApplicantRate">
                    <option value="Hirable">Hirable</option>
                    <option value="Wait">Wait</option>
                    <option value="Unacceptable">Unacceptable</option>
                  </label>
                  <select
                    onChange={(e) => changeRating(e, i)}
                    name="ApplicantRate"
                    id="ApplicantRate"
                    defaultValue={x.status.toLocaleUpperCase()}></select>
                  {x.status}
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
                  Page {pageNumber + 1} of {totalPages + 1}{" "}
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
      <button
        type="button"
        onClick={() => {
          sendChange(true);
        }}>
        Apply changes
      </button>
    </>
  );
}
