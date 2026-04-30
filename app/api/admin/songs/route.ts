import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { invalidate, cached, TTL } from "@/app/lib/cache";
import { getUserFromRequest, requireAdmin } from "@/app/lib/auth";
import { Prisma } from "@prisma/client";
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

function prismaClientMessage(err: unknown): string | null {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2003") return "关联数据不存在（例如所选分类已被删除）";
    if (err.code === "P2002") return "数据冲突，请重试或更换分类组合";
    if (err.code === "P1001") return "无法连接数据库，请检查 DATABASE_URL 与 Postgres 是否已启动";
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const admin = getUserFromRequest(req);
    if (!admin || admin.role !== "admin") {
      return NextResponse.json({ success: false, error: "无权限" }, { status: 403 });
    }

    let raw: unknown;
    try {
      raw = await req.json();
    } catch {
      return NextResponse.json({ success: false, error: "请求体不是合法 JSON" }, { status: 400 });
    }

    const parsed = songCreateSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || "参数错误" },
        { status: 400 }
      );
    }

    const body = parsed.data;
    const song = await prisma.song.create({
      data: {
        name: body.name,
        artist: body.artist,
        album: body.album,
        durationSec: body.durationSec,
        releaseDate: new Date(body.releaseDate),
        genre: body.genre,
        coverUrl: body.coverUrl ?? null,
        qqMusicUrl: body.qqMusicUrl || null,
        neteaseUrl: body.neteaseUrl || null,
        qishuiUrl: body.qishuiUrl || null,
        kuwoUrl: body.kuwoUrl || null,
        createdById: admin.userId,
        categories: body.categoryIds?.length
          ? { create: body.categoryIds.map((categoryId: string) => ({ categoryId })) }
          : undefined,
      },
      select: {
        id: true,
        name: true,
        artist: true,
        album: true,
        durationSec: true,
        releaseDate: true,
        genre: true,
        coverUrl: true,
        status: true,
        createdById: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    invalidate("admin:songs");
    invalidate("client:home");
    return NextResponse.json({ success: true, data: song }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/songs]", err);
    const prismaMsg = prismaClientMessage(err);
    const devDetail =
      process.env.NODE_ENV !== "production" && err instanceof Error ? err.message : null;
    const message = prismaMsg ?? devDetail ?? "服务器内部错误";
    let status = 500;
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2003" || err.code === "P2002") status = 400;
      else if (err.code === "P1001") status = 503;
    }
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
