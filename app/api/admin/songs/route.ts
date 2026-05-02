import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { invalidate, cached, TTL } from "@/app/lib/cache";
import { getUserFromRequest, requireAdmin } from "@/app/lib/auth";
import type { Prisma } from "@prisma/client";
import { songCreateSchema } from "@/app/lib/validators";

export async function GET(req: NextRequest) {
  if (!requireAdmin(req)) return NextResponse.json({ success: false, error: "无权限" }, { status: 403 });
  const page = Number(req.nextUrl.searchParams.get("page") || "1");
  const pageSize = Number(req.nextUrl.searchParams.get("pageSize") || "20");
  const q = req.nextUrl.searchParams.get("q") || "";
  const key = `admin:songs:${page}:${pageSize}:${q}`;
  const data = await cached(key, async () => {
    const where: Prisma.SongWhereInput = q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { artist: { contains: q, mode: "insensitive" } },
            { album: { contains: q, mode: "insensitive" } },
          ],
        }
      : {};
    const [items, total] = await Promise.all([
      prisma.song.findMany({ where, skip: (page - 1) * pageSize, take: pageSize, orderBy: [{ createdAt: "desc" }, { releaseDate: "desc" }], include: { categories: { include: { category: true } } } }),
      prisma.song.count({ where }),
    ]);
    return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }, TTL.ADMIN_LIST);
  return NextResponse.json({ success: true, data });
}

export async function POST(req: NextRequest) {
  const admin = getUserFromRequest(req);
  if (!admin || admin.role !== "admin") return NextResponse.json({ success: false, error: "无权限" }, { status: 403 });
  const parsed = songCreateSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message || "参数错误" }, { status: 400 });
  const body = parsed.data;
  const song = await prisma.song.create({
    data: {
      name: body.name,
      artist: body.artist,
      album: body.album,
      durationSec: Number(body.durationSec || 0),
      releaseDate: new Date(body.releaseDate),
      genre: body.genre,
      coverUrl: body.coverUrl || null,
      qqMusicUrl: body.qqMusicUrl || null,
      neteaseUrl: body.neteaseUrl || null,
      qishuiUrl: body.qishuiUrl || null,
      kuwoUrl: body.kuwoUrl || null,
      createdById: admin.userId,
      categories: body.categoryIds?.length ? { create: body.categoryIds.map((categoryId: string) => ({ categoryId })) } : undefined,
    },
  });
  invalidate("admin:songs");
  invalidate("client:home");
  return NextResponse.json({ success: true, data: song }, { status: 201 });
}
