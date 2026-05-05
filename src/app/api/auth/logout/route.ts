import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ success: true });
  
  response.cookies.delete("token_ADMIN");
  response.cookies.delete("token_CUSTOMER");
  response.cookies.delete("token");
  
  return response;
}
