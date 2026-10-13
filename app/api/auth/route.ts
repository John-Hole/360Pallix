import { NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, ADMIN_COOKIE_VALUE } from "@/lib/auth";

export async function GET() {
  const res = NextResponse.json({ ok: true, authenticated: true });
  res.cookies.set(ADMIN_COOKIE_NAME, ADMIN_COOKIE_VALUE, {
    path: "/",
    httpOnly: false,
    sameSite: "lax",
    maxAge: 31536000, // 1 year
  });
  return res;
}

export async function POST() {
  const res = NextResponse.json({ ok: true, authenticated: true });
  res.cookies.set(ADMIN_COOKIE_NAME, ADMIN_COOKIE_VALUE, {
    path: "/",
    httpOnly: false,
    sameSite: "lax",
    maxAge: 31536000, // 1 year
  });
  return res;
}
