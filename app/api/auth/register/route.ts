import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { hashPassword, signToken } from "@/app/lib/auth";
import { authSchema } from "@/app/lib/validators";
import { hitRateLimit } from "@/app/lib/rate-limit";

export async function POST(req: NextRequest) {
  if (hitRateLimit(req, "auth:register", 10, 60_000)) {
    return NextResponse.json({ success: false, error: "请求过于频繁" }, { status: 429 });
  }
  const parsed = authSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message || "参数错误" }, { status: 400 });
  const { phone, password, nickname } = parsed.data;

  const exists = await prisma.user.findUnique({ where: { phone } });
  if (exists) return NextResponse.json({ success: false, error: "手机号已注册" }, { status: 409 });

  const user = await prisma.user.create({
    data: { phone, nickname: nickname || null, passwordHash: await hashPassword(password), role: "user" },
  });

  await prisma.userCategory.create({ data: { userId: user.id, name: "喜欢", isSystem: true } });

  const token = signToken({ userId: user.id, phone: user.phone, role: user.role });
  const res = NextResponse.json({ success: true, data: { user: { id: user.id, phone: user.phone, role: user.role } } });
  res.cookies.set("token", token, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7 });
  return res;
}
