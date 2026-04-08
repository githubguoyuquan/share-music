import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getUserFromRequest } from "@/app/lib/auth";

export async function GET(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ success: false, error: "请先登录" }, { status: 401 });
  const data = await prisma.userCategory.findMany({ where: { userId: user.userId }, include: { songs: { include: { song: true } } }, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ success: true, data });
}

export async function POST(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ success: false, error: "请先登录" }, { status: 401 });
  const body = await req.json();

  // Create custom category
  if (body?.name && !body?.songId) {
    const data = await prisma.userCategory.create({ data: { userId: user.userId, name: body.name, isSystem: false } });
    return NextResponse.json({ success: true, data }, { status: 201 });
  }

  // Quick add song to an existing custom category
  if (body?.categoryId && body?.songId) {
    const cat = await prisma.userCategory.findFirst({
      where: { id: body.categoryId, userId: user.userId },
      select: { id: true },
    });
    if (!cat) return NextResponse.json({ success: false, error: "分类不存在" }, { status: 404 });
    const data = await prisma.userCategorySong.upsert({
      where: { categoryId_songId: { categoryId: body.categoryId, songId: body.songId } },
      update: {},
      create: { categoryId: body.categoryId, songId: body.songId, userId: user.userId },
    });
    return NextResponse.json({ success: true, data });
  }

  return NextResponse.json({ success: false, error: "参数错误" }, { status: 400 });
}
