import { NextResponse } from "next/server";

export async function GET(request) {
  console.log("HBL backend callback received:", request.nextUrl.search);
  return NextResponse.json({ success: true });
}

export async function POST(request) {
  const body = await request.text();
  console.log("HBL backend callback received:", body);
  return NextResponse.json({ success: true });
}
