import { NextRequest, NextResponse } from "next/server";

export async function GET(request:Request){}
export async function POST(request:Request){
    let response = await fetch('mylambdafunctionurl',{
        method: request.method,
        body:request.body,
        duplex:"half" //for some reason requires a duplex member which isn't supposed to exist
    })
    response = await response.json()
    return NextResponse.json(response)
}
