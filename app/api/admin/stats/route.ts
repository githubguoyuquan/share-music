import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { requireAdmin } from "@/app/lib/auth";

export async function GET(req: NextRequest) {
  if (!requireAdmin(req)) return NextResponse.json({ success: false, error: "无权限" }, { status: 403 });

  const [songCount, categoryCount, userCount, recentSongs] = await Promise.all([
    prisma.song.count(),
    prisma.songCategory.count(),
    prisma.user.count(),
    prisma.song.findMany({ take: 5, orderBy: { createdAt: "desc" }, select: { id: true, name: true, artist: true, createdAt: true } }),
  ]);

  return NextResponse.json({
    success: true,
    data: { songCount, categoryCount, userCount, recentSongs },
  });
}
