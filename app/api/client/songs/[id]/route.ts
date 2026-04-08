import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

type Context = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: Context) {
  try {
    const { id } = await ctx.params;
    const song = await prisma.song.findUnique({
      where: { id },
      include: { categories: { include: { category: true } } },
    });
    if (!song) return NextResponse.json({ success: false, error: "歌曲不存在" }, { status: 404 });
    return NextResponse.json({ success: true, data: song });
  } catch (err) {
    console.error("GET /api/client/songs/[id] error:", err);
    return NextResponse.json({ success: false, error: "服务器内部错误" }, { status: 500 });
  }
}
