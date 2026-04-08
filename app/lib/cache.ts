type Entry<T> = { value: T; expiresAt: number };
const store = new Map<string, Entry<unknown>>();

export const TTL = {
  HOME: 30_000,
  SONG_DETAIL: 60_000,
  ADMIN_LIST: 20_000,
} as const;

export async function cached<T>(key: string, fetcher: () => Promise<T>, ttl = 30_000): Promise<T> {
  const now = Date.now();
  const old = store.get(key) as Entry<T> | undefined;
  if (old && old.expiresAt > now) return old.value;
  const value = await fetcher();
  store.set(key, { value, expiresAt: now + ttl });
  return value;
}

export function invalidate(prefix: string) {
  for (const k of store.keys()) if (k.startsWith(prefix)) store.delete(k);
}
