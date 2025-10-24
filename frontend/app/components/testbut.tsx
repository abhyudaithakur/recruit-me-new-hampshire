'use client'
export default function TestBut() {
  const submitData = async () => {
    let response = await fetch("api/hello", {
      method: "POST",
      body: JSON.stringify({
        arg1: 1,
        arg2: 2,
      }),
      
      headers: {
        "Content-type": "application/json",
      },
    });

    response = await response.json();

    alert(JSON.stringify(response));
  };
  return <button type="button" className="bg-red-500" onClick={submitData}>request sum</button>;
}
