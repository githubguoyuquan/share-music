import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getUserFromRequest } from "@/app/lib/auth";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ success: false, error: "请先登录" }, { status: 401 });
  const { id } = await ctx.params;
  const { name } = await req.json();
  if (!name?.trim()) return NextResponse.json({ success: false, error: "名称不能为空" }, { status: 400 });

  const row = await prisma.userCategory.findFirst({ where: { id, userId: user.userId } });
  if (!row) return NextResponse.json({ success: false, error: "分类不存在" }, { status: 404 });
  if (row.isSystem) return NextResponse.json({ success: false, error: "系统分类不可重命名" }, { status: 400 });

  await prisma.userCategory.update({ where: { id }, data: { name: name.trim() } });
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ success: false, error: "请先登录" }, { status: 401 });
  const { id } = await ctx.params;

  const row = await prisma.userCategory.findFirst({ where: { id, userId: user.userId } });
  if (!row) return NextResponse.json({ success: false, error: "分类不存在" }, { status: 404 });
  if (row.isSystem) return NextResponse.json({ success: false, error: "系统分类不可删除" }, { status: 400 });

  await prisma.userCategory.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
