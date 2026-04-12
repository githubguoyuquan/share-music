import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/app/lib/prisma";
import { requireAdmin } from "@/app/lib/auth";
import { categorySchema } from "@/app/lib/validators";

export async function GET(req: NextRequest) {
  try {
    if (!requireAdmin(req)) return NextResponse.json({ success: false, error: "无权限" }, { status: 403 });
    const flat = req.nextUrl.searchParams.get("flat") === "1";
    const rows = await prisma.songCategory.findMany({
      orderBy: [{ createdAt: "asc" }],
      include: {
        _count: { select: { songs: true } },
      },
    });
    if (flat) return NextResponse.json({ success: true, data: rows });
    const parents = rows
      .filter((c) => !c.parentId)
      .map((p) => ({
        ...p,
        children: rows.filter((c) => c.parentId === p.id),
      }));
    const data = parents;
    return NextResponse.json({ success: true, data });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2022") {
        return NextResponse.json({ success: false, error: "分类结构字段缺失，请执行 `npx prisma db push` 后重试" }, { status: 500 });
      }
    }
    return NextResponse.json({ success: false, error: "分类列表加载失败" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!requireAdmin(req)) return NextResponse.json({ success: false, error: "无权限" }, { status: 403 });
    const raw = await req.json();
    const parsed = categorySchema.safeParse(raw);
    if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message || "参数错误" }, { status: 400 });
    const { name, color } = parsed.data;
    const parentId = raw?.parentId ? String(raw.parentId) : null;
    if (parentId) {
      const parent = await prisma.songCategory.findUnique({ where: { id: parentId } });
      if (!parent) return NextResponse.json({ success: false, error: "上级分类不存在" }, { status: 400 });
      if (parent.parentId) return NextResponse.json({ success: false, error: "仅支持两级分类" }, { status: 400 });
    }
    const data = await prisma.songCategory.create({ data: { name: name.trim(), color: color || null, parentId } });
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ success: false, error: "分类名已存在" }, { status: 409 });
    }
    return NextResponse.json({ success: false, error: "创建分类失败" }, { status: 500 });
  }
}
