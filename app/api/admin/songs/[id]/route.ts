import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { requireAdmin } from "@/app/lib/auth";
import { invalidate } from "@/app/lib/cache";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, ctx: Ctx) {
  if (!requireAdmin(req)) return NextResponse.json({ success: false, error: "无权限" }, { status: 403 });
  const { id } = await ctx.params;
  const body = await req.json();

  const existing = await prisma.song.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ success: false, error: "歌曲不存在" }, { status: 404 });

  const song = await prisma.song.update({
    where: { id },
    data: {
      name: body.name ?? existing.name,
      artist: body.artist ?? existing.artist,
      album: body.album ?? existing.album,
      durationSec: body.durationSec != null ? Number(body.durationSec) : existing.durationSec,
      releaseDate: body.releaseDate ? new Date(body.releaseDate) : existing.releaseDate,
      genre: body.genre ?? existing.genre,
      coverUrl: body.coverUrl !== undefined ? body.coverUrl : existing.coverUrl,
      qqMusicUrl: body.qqMusicUrl !== undefined ? body.qqMusicUrl : existing.qqMusicUrl,
      neteaseUrl: body.neteaseUrl !== undefined ? body.neteaseUrl : existing.neteaseUrl,
      qishuiUrl: body.qishuiUrl !== undefined ? body.qishuiUrl : existing.qishuiUrl,
      kuwoUrl: body.kuwoUrl !== undefined ? body.kuwoUrl : existing.kuwoUrl,
    },
  });

  if (Array.isArray(body.categoryIds)) {
    await prisma.songCategoryMap.deleteMany({ where: { songId: id } });
    if (body.categoryIds.length) {
      await prisma.songCategoryMap.createMany({ data: body.categoryIds.map((categoryId: string) => ({ songId: id, categoryId })) });
    }
  }

  invalidate("admin:songs");
  invalidate("client:home");
  invalidate(`client:song:${id}`);
  return NextResponse.json({ success: true, data: song });
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  if (!requireAdmin(req)) return NextResponse.json({ success: false, error: "无权限" }, { status: 403 });
  const { id } = await ctx.params;

  const existing = await prisma.song.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ success: false, error: "歌曲不存在" }, { status: 404 });

  await prisma.song.delete({ where: { id } });
  invalidate("admin:songs");
  invalidate("client:home");
  return NextResponse.json({ success: true });
}
