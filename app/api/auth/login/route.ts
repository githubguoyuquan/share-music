import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { signToken, verifyPassword } from "@/app/lib/auth";
import { authSchema } from "@/app/lib/validators";
import { hitRateLimit } from "@/app/lib/rate-limit";

export async function POST(req: NextRequest) {
  if (hitRateLimit(req, "auth:login", 15, 60_000)) {
    return NextResponse.json({ success: false, error: "请求过于频繁" }, { status: 429 });
  }
  const parsed = authSchema.pick({ phone: true, password: true }).safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message || "参数错误" }, { status: 400 });
  const { phone, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { phone } });
  if (!user) return NextResponse.json({ success: false, error: "账号或密码错误" }, { status: 401 });
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) return NextResponse.json({ success: false, error: "账号或密码错误" }, { status: 401 });

  const token = signToken({ userId: user.id, phone: user.phone, role: user.role });
  const res = NextResponse.json({ success: true, data: { user: { id: user.id, phone: user.phone, role: user.role } } });
  res.cookies.set("token", token, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7 });
  return res;
}
