import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { requireAdmin } from "@/app/lib/auth";
import { categorySchema } from "@/app/lib/validators";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, ctx: Ctx) {
  if (!requireAdmin(req)) return NextResponse.json({ success: false, error: "无权限" }, { status: 403 });
  const { id } = await ctx.params;
  const raw = await req.json();
  const parsed = categorySchema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message || "参数错误" }, { status: 400 });
  const { name, color } = parsed.data;
  const existing = await prisma.songCategory.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ success: false, error: "分类不存在" }, { status: 404 });
  const parentId = raw?.parentId ? String(raw.parentId) : null;
  if (parentId === id) return NextResponse.json({ success: false, error: "不能设置自己为上级" }, { status: 400 });
  if (parentId) {
    const parent = await prisma.songCategory.findUnique({ where: { id: parentId } });
    if (!parent) return NextResponse.json({ success: false, error: "上级分类不存在" }, { status: 400 });
    if (parent.parentId) return NextResponse.json({ success: false, error: "仅支持两级分类" }, { status: 400 });
  }
  const childCount = await prisma.songCategory.count({ where: { parentId: id } });
  if (childCount > 0 && parentId) {
    return NextResponse.json({ success: false, error: "已有二级分类的一级分类不能再挂到其它上级" }, { status: 400 });
  }
  const data = await prisma.songCategory.update({ where: { id }, data: { name: name.trim(), color: color || null, parentId } });
  return NextResponse.json({ success: true, data });
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  if (!requireAdmin(req)) return NextResponse.json({ success: false, error: "无权限" }, { status: 403 });
  const { id } = await ctx.params;
  const existing = await prisma.songCategory.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ success: false, error: "分类不存在" }, { status: 404 });
  const childCount = await prisma.songCategory.count({ where: { parentId: id } });
  if (childCount > 0) return NextResponse.json({ success: false, error: `该一级分类下仍有 ${childCount} 个二级分类，请先处理` }, { status: 400 });
  const bindCount = await prisma.songCategoryMap.count({ where: { categoryId: id } });
  if (bindCount > 0) return NextResponse.json({ success: false, error: `该分类下仍有 ${bindCount} 首关联歌曲，请先调整` }, { status: 400 });
  await prisma.songCategory.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
