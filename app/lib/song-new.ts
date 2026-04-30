/** 客户端列表「new」标签：仅按平台入库时间 `createdAt`，最近 N 天内录入为 true */
export const NEW_SONG_MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000;

export function isSongWithinNewWindow(
  createdAt: Date | string | null | undefined,
  nowMs = Date.now()
): boolean {
  if (createdAt == null) return false;
  const t =
    createdAt instanceof Date ? createdAt.getTime() : new Date(createdAt).getTime();
  if (Number.isNaN(t)) return false;
  const ageMs = nowMs - t;
  if (ageMs < 0) return false;
  return ageMs <= NEW_SONG_MAX_AGE_MS;
}
