import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getUserFromRequest } from "@/app/lib/auth";
import { invalidate } from "@/app/lib/cache";

export async function GET(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ success: false, error: "请先登录" }, { status: 401 });
  // One-time legacy migration:
  // move songs from old default "我的歌单" into pinned "喜欢", then remove legacy category.
  const legacy = await prisma.userCategory.findMany({
    where: { userId: user.userId, name: "我的歌单" },
    include: { songs: { select: { songId: true } } },
  });
  if (legacy.length) {
    const like = await prisma.userCategory.upsert({
      where: { userId_name: { userId: user.userId, name: "喜欢" } },
      update: { isSystem: true },
      create: { userId: user.userId, name: "喜欢", isSystem: true },
      select: { id: true },
    });
    const songIds = Array.from(new Set(legacy.flatMap((c) => c.songs.map((s) => s.songId))));
    if (songIds.length) {
      await prisma.userCategorySong.createMany({
        data: songIds.map((songId) => ({ userId: user.userId, categoryId: like.id, songId })),
        skipDuplicates: true,
      });
    }
    await prisma.userCategory.deleteMany({ where: { userId: user.userId, name: "我的歌单" } });
  }

  const rows = await prisma.userCategory.findMany({
    where: { userId: user.userId },
    include: { songs: { include: { song: true } } },
    // Base order: oldest -> newest for normal categories.
    orderBy: { createdAt: "asc" },
  });
  // "喜欢" is a pinned system category and always shown first.
  const visible = rows.filter((c) => c.name !== "我的歌单");
  const likes = visible.filter((c) => c.name === "喜欢");
  const normal = visible.filter((c) => c.name !== "喜欢");
  return NextResponse.json({ success: true, data: [...likes, ...normal] });
}

export async function POST(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ success: false, error: "请先登录" }, { status: 401 });
  const body = await req.json();

  // Create custom category
  if (body?.name && !body?.songId) {
    if (String(body.name).trim() === "我的歌单") {
      return NextResponse.json({ success: false, error: "该分类名不可用" }, { status: 400 });
    }
    const data = await prisma.userCategory.create({ data: { userId: user.userId, name: body.name, isSystem: false } });
    return NextResponse.json({ success: true, data }, { status: 201 });
  }

  // Quick add song to an existing custom category
  if (body?.categoryId && body?.songId) {
    const cat = await prisma.userCategory.findFirst({
      where: { id: body.categoryId, userId: user.userId },
      select: { id: true, name: true },
    });
    if (!cat) return NextResponse.json({ success: false, error: "分类不存在" }, { status: 404 });
    const data = await prisma.userCategorySong.upsert({
      where: { categoryId_songId: { categoryId: body.categoryId, songId: body.songId } },
      update: {},
      create: { categoryId: body.categoryId, songId: body.songId, userId: user.userId },
    });
    if (cat.name === "喜欢") {
      await prisma.favorite.upsert({
        where: { userId_songId: { userId: user.userId, songId: body.songId } },
        update: {},
        create: { userId: user.userId, songId: body.songId },
      });
      invalidate("client:home");
    }
    return NextResponse.json({ success: true, data });
  }

  return NextResponse.json({ success: false, error: "参数错误" }, { status: 400 });
}
