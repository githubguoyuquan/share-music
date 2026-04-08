import { NextRequest } from "next/server";

const memory = new Map<string, { count: number; resetAt: number }>();

export function hitRateLimit(req: NextRequest, key: string, limit = 20, windowMs = 60_000) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const k = `${key}:${ip}`;
  const now = Date.now();
  const row = memory.get(k);
  if (!row || row.resetAt < now) {
    memory.set(k, { count: 1, resetAt: now + windowMs });
    return false;
  }
  row.count += 1;
  if (row.count > limit) return true;
  return false;
}
