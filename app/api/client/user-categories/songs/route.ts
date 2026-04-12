import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getUserFromRequest } from "@/app/lib/auth";
import { invalidate } from "@/app/lib/cache";

export async function DELETE(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ success: false, error: "请先登录" }, { status: 401 });
  const { categoryId, songId } = await req.json();

  const cat = await prisma.userCategory.findFirst({ where: { id: categoryId, userId: user.userId } });
  if (!cat) return NextResponse.json({ success: false, error: "分类不存在" }, { status: 404 });

  await prisma.userCategorySong.deleteMany({ where: { categoryId, songId, userId: user.userId } });
  if (cat.name === "喜欢") {
    await prisma.favorite.deleteMany({ where: { userId: user.userId, songId } });
    invalidate("client:home");
  }
  return NextResponse.json({ success: true });
}
