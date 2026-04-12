import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { hashPassword, signToken } from "@/app/lib/auth";
import { authSchema } from "@/app/lib/validators";
import { hitRateLimit } from "@/app/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    if (hitRateLimit(req, "auth:register", 10, 60_000)) {
      return NextResponse.json({ success: false, error: "请求过于频繁" }, { status: 429 });
    }
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ success: false, error: "请求体不是有效的 JSON" }, { status: 400 });
    }
    const parsed = authSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message || "参数错误" }, { status: 400 });
    }
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
  } catch (e) {
    console.error("[POST /api/auth/register]", e);
    const msg = process.env.NODE_ENV === "development" && e instanceof Error ? e.message : "服务器错误";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
