import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ success: true });
  
  // Clear the session cookies so middleware doesn't bounce the user back
  response.cookies.set("iscarb_session", "", { maxAge: 0, path: "/" });
  response.cookies.set("next-auth.session-token", "", { maxAge: 0, path: "/" });
  
  return response;
}
