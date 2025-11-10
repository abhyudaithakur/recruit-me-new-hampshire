import { Axios } from "axios";
import ApplicantTable from "./ApplicantTable";

interface ApplicantReviewProps {
  jobID: number;
  jobName: string;
  instance: Axios;
}


export default function ApplicantReview({
  jobID,
  jobName,
  instance,
}: ApplicantReviewProps) {
  const pageSize = 2;

  return (
    <>
      <h1>
        Applicants for {jobName}: {jobID}
      </h1>

      <div>
        <ApplicantTable jobID={jobID} pageSize={pageSize} instance={instance} TableName={"Wait"} status="Wait"></ApplicantTable>
        <ApplicantTable jobID={jobID} pageSize={pageSize} instance={instance} TableName={"Hirable"} status="Hirable"></ApplicantTable>
        <ApplicantTable jobID={jobID} pageSize={pageSize} instance={instance} TableName={"Unacceptable"} status="Unacceptable"></ApplicantTable>
        <ApplicantTable jobID={jobID} pageSize={pageSize} instance={instance} TableName={"Active"} status="active"></ApplicantTable>
      </div>
    </>
  );
}
