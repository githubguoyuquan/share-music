import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { requireAdmin } from "@/app/lib/auth";
import { categorySchema } from "@/app/lib/validators";

export async function GET(req: NextRequest) {
  if (!requireAdmin(req)) return NextResponse.json({ success: false, error: "无权限" }, { status: 403 });
  const data = await prisma.songCategory.findMany({ orderBy: { createdAt: "desc" }, include: { _count: { select: { songs: true } } } });
  return NextResponse.json({ success: true, data });
}

export async function POST(req: NextRequest) {
  if (!requireAdmin(req)) return NextResponse.json({ success: false, error: "无权限" }, { status: 403 });
  const parsed = categorySchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message || "参数错误" }, { status: 400 });
  const { name, color } = parsed.data;
  const data = await prisma.songCategory.create({ data: { name: name.trim(), color: color || null } });
  return NextResponse.json({ success: true, data }, { status: 201 });
}
