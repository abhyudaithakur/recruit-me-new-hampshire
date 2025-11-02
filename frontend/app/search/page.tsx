'use client'
import { useState } from "react";

interface jobDescription {
  jobName: string;
  companyName: string;
  skills: string[];
}

const temp:jobDescription[] = [
{jobName:"1",companyName:"2",skills:['3','4','5']},
{jobName:"1",companyName:"2",skills:['3','4','5']},
{jobName:"1",companyName:"2",skills:['3','4','5']},
{jobName:"1",companyName:"2",skills:['3','4','5']},
{jobName:"1",companyName:"2",skills:['3','4','5']},
{jobName:"1",companyName:"2",skills:['3','4','5']},
]

export default function search() {
  const [jobs, setJobs] = useState<jobDescription[]>(temp);
//   setJobs(temp)

  return (
    <>
      <h1>Search</h1>
      <form action="" method="post">
        <input placeholder="Search" type="text" />
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
                  <td>{x.skills.reduce((x,c,id)=>{return id==0?c: x+', '+c},'')}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <th colSpan={3}>Pages</th>
            </tr>
          </tfoot>
        </table>
      </div>
    </>
  );
}
