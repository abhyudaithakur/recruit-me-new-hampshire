import { ChangeEvent, Dispatch, SetStateAction, useState } from "react";

interface skillListProps {
  skills: string[];
  setSkills: Dispatch<SetStateAction<string[]>>;
}

export function SkillList({ skills, setSkills }: skillListProps) {
  const [selectedSkill, setSelectedSkill] = useState(-1);

  function onSkillClick(index: number) {
    const vals = skills.filter((x, i) => x.length > 0 || i == index);
    let ik = new Set(vals);
    setSelectedSkill(index);
    setSkills([...ik]);
    return vals.slice();
  }
  function loseFocus() {
    onSkillClick(-1);
  }

  function changeSelectedValue(
    index: number,
    e: ChangeEvent<HTMLInputElement>
  ) {
    let sk2 = skills.map((x, i) => {
      if (i == index) {
        return e.target.value;
      } else {
        return x;
      }
    });
    setSkills(sk2);
  }
  return (
    <>
      <style>
        {`
        tr {line-height:2em;}
        table, th, td {border:1px solid;}
        th {width:300px;}
        td {padding-left:.5em; padding-right:1em}
        input {width:100%; height:100%}
        td:first-child { min-width:200px; max-width: 200px; overflow-x:clip;}
        `}
      </style>
      <table>
        <thead>
          <tr>
            <th colSpan={2}>Skills</th>
          </tr>
        </thead>
        <tbody>
          {skills.map((x, i) => {
            return (
              <tr key={i}>
                {selectedSkill != i ? (
                  <td key={i} onClick={() => onSkillClick(i)}>
                    {x}
                  </td>
                ) : (
                  <td>
                    <form
                      action=""
                      onSubmit={(e) => {
                        e.preventDefault();
                        loseFocus();
                      }}>
                      <input
                        autoFocus={true}
                        onBlur={() => loseFocus()}
                        onChange={(e) => changeSelectedValue(i, e)}
                        type={"text"}
                        placeholder={"skill"}
                        value={x}></input>
                    </form>
                  </td>
                )}
                <td
                  onClick={(e) => setSkills(skills.filter((x, id) => i != id))}>
                  remove
                </td>
              </tr>
            );
          })}
          <tr
            onClick={() => {
              let iii = onSkillClick(skills.length);
              iii.push("");
              setSkills(iii);
            }}>
            <td colSpan={2}>+ Add Skill</td>
          </tr>
        </tbody>
      </table>
    </>
  );
}
