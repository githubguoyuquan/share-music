import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { cached, TTL } from "@/app/lib/cache";
import { getUserFromRequest } from "@/app/lib/auth";
import { isSongWithinNewWindow } from "@/app/lib/song-new";

export async function GET(req: NextRequest) {
  const page = Number(req.nextUrl.searchParams.get("page") || "1");
  const pageSize = Number(req.nextUrl.searchParams.get("pageSize") || "24");
  const user = getUserFromRequest(req);
  const key = `client:home:${page}:${pageSize}`;

  const data = await cached(key, async () => {
    const [songs, total, categories] = await Promise.all([
      prisma.song.findMany({
        where: { status: "active" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: [{ releaseDate: "desc" }, { createdAt: "desc" }],
        include: { categories: { include: { category: true } } },
      }),
      prisma.song.count({ where: { status: "active" } }),
      prisma.songCategory.findMany({ orderBy: { createdAt: "desc" } }),
    ]);
    return { songs, categories, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }, TTL.HOME);

  let favoriteSongIds: string[] = [];
  if (user) {
    const favorites = await prisma.favorite.findMany({ where: { userId: user.userId }, select: { songId: true } });
    favoriteSongIds = favorites.map((f) => f.songId);
  }

  const now = Date.now();
  const songsWithNew = data.songs.map((s) => {
    const plain = JSON.parse(JSON.stringify(s)) as Record<string, unknown>;
    plain.isNew = isSongWithinNewWindow(s.createdAt, now);
    return plain;
  });

  const res = NextResponse.json({
    success: true,
    data: { ...data, songs: songsWithNew, favoriteSongIds },
  });
  res.headers.set("Cache-Control", "private, no-store");
  return res;
}
