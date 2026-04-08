import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { requireAdmin } from "@/app/lib/auth";
import { categorySchema } from "@/app/lib/validators";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, ctx: Ctx) {
  if (!requireAdmin(req)) return NextResponse.json({ success: false, error: "无权限" }, { status: 403 });
  const { id } = await ctx.params;
  const parsed = categorySchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message || "参数错误" }, { status: 400 });
  const { name, color } = parsed.data;
  const data = await prisma.songCategory.update({ where: { id }, data: { name: name.trim(), color: color || null } });
  return NextResponse.json({ success: true, data });
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  if (!requireAdmin(req)) return NextResponse.json({ success: false, error: "无权限" }, { status: 403 });
  const { id } = await ctx.params;
  const bindCount = await prisma.songCategoryMap.count({ where: { categoryId: id } });
  if (bindCount > 0) return NextResponse.json({ success: false, error: "该分类下仍有关联歌曲，请先调整" }, { status: 400 });
  await prisma.songCategory.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
