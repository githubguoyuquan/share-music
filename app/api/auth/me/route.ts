import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";

export async function GET(req: NextRequest) {
  const auth = getUserFromRequest(req);
  if (!auth) return NextResponse.json({ success: false }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { id: auth.userId }, select: { id: true, phone: true, role: true, nickname: true } });
  if (!user) return NextResponse.json({ success: false }, { status: 401 });
  return NextResponse.json({ success: true, data: user });
}

export async function POST() {
  const res = NextResponse.json({ success: true });
  res.cookies.set("token", "", { path: "/", maxAge: 0 });
  return res;
}
