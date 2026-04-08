import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getUserFromRequest } from "@/app/lib/auth";
import { invalidate } from "@/app/lib/cache";
import { favoriteSchema } from "@/app/lib/validators";
import { hitRateLimit } from "@/app/lib/rate-limit";

export async function POST(req: NextRequest) {
  if (hitRateLimit(req, "client:favorites", 30, 60_000)) {
    return NextResponse.json({ success: false, error: "请求过于频繁" }, { status: 429 });
  }
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ success: false, error: "请先登录" }, { status: 401 });
  const parsed = favoriteSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message || "参数错误" }, { status: 400 });
  const { songId } = parsed.data;
  await prisma.favorite.upsert({
    where: { userId_songId: { userId: user.userId, songId } },
    update: {},
    create: { userId: user.userId, songId },
  });
  const likeCategory = await prisma.userCategory.upsert({
    where: { userId_name: { userId: user.userId, name: "喜欢" } },
    update: {},
    create: { userId: user.userId, name: "喜欢", isSystem: true },
  });
  await prisma.userCategorySong.upsert({
    where: { categoryId_songId: { categoryId: likeCategory.id, songId } },
    update: {},
    create: { categoryId: likeCategory.id, songId, userId: user.userId },
  });
  invalidate("client:home");
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  if (hitRateLimit(req, "client:favorites", 30, 60_000)) {
    return NextResponse.json({ success: false, error: "请求过于频繁" }, { status: 429 });
  }
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ success: false, error: "请先登录" }, { status: 401 });
  const parsed = favoriteSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message || "参数错误" }, { status: 400 });
  const { songId } = parsed.data;

  await prisma.favorite.deleteMany({ where: { userId: user.userId, songId } });
  await prisma.userCategorySong.deleteMany({
    where: {
      userId: user.userId,
      songId,
      category: { name: "喜欢" },
    },
  });
  invalidate("client:home");
  return NextResponse.json({ success: true });
}
