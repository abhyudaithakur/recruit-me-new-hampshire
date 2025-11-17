import { Axios } from "axios";
import ApplicantTable from "./ApplicantTable";
import { IAuthContext } from "./AuthProvider";
import { useState } from "react";

interface ApplicantReviewProps {
  jobID: number;
  jobName: string;
  instance: Axios;
  credentails: IAuthContext;
}

export default function ApplicantReview({
  jobID,
  jobName,
  instance,
  credentails,
}: ApplicantReviewProps) {
  const pageSize = 5;


  return (
    <>
      <h1>
        Applicants for {jobName}: {jobID}
      </h1>

      <div style={{display:"flex",flexWrap:"wrap", gridTemplateColumns:"auto auto auto",gap:30}}>
        <ApplicantTable
          jobID={jobID}
          credentails={credentails}
          pageSize={pageSize}
          instance={instance}
          TableName={"Wait"}
          status="Wait"></ApplicantTable>
        <ApplicantTable
          jobID={jobID}
          credentails={credentails}
          pageSize={pageSize}
          instance={instance}
          TableName={"Hirable"}
          status="Hirable"></ApplicantTable>
        <ApplicantTable
          jobID={jobID}
          credentails={credentails}
          pageSize={pageSize}
          instance={instance}
          TableName={"Unacceptable"}
          status="Unacceptable"></ApplicantTable>
        <ApplicantTable
          jobID={jobID}
          credentails={credentails}
          pageSize={pageSize}
          instance={instance}
          TableName={"Active"}
          status="active"></ApplicantTable>
      </div>
      {/* <button type="button" onClick={()=>setUpdate2()}>Update</button> */}
    </>
  );
}
