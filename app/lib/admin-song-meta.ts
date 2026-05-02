/** 后台「自动抓取」歌曲元信息：与 `/api/admin/song-meta` 请求/合并逻辑 */

export type SongMetaPayload = {
  name?: string;
  artist?: string;
  album?: string;
  durationSec?: string | number;
  releaseDate?: string;
  genre?: string;
  coverUrl?: string;
};

export type AdminSongMetaFormFields = {
  name: string;
  artist: string;
  album: string;
  durationSec: string;
  releaseDate: string;
  genre: string;
  coverUrl: string;
  categoryIds: string[];
};

export function buildSongMetaApiUrl(name: string, artist?: string): string {
  const params = new URLSearchParams({ name: name.trim() });
  const a = artist?.trim();
  if (a) params.set("artist", a);
  return `/api/admin/song-meta?${params.toString()}`;
}

/** 仅歌名：接口返回歌手候选列表 */
export async function fetchArtistsBySongName(name: string): Promise<
  | { ok: true; artists: string[] }
  | { ok: false; error: string; status: number }
> {
  const url = buildSongMetaApiUrl(name.trim());
  const res = await fetch(url);
  let data: { success?: boolean; error?: string; data?: { artists?: string[] } } = {};
  try {
    data = await res.json();
  } catch {
    return { ok: false, error: "响应不是合法 JSON", status: res.status };
  }
  if (!res.ok || !data.success) {
    return { ok: false, error: data.error || "抓取歌手失败", status: res.status };
  }
  const artists = Array.isArray(data.data?.artists) ? data.data!.artists! : [];
  return { ok: true, artists };
}

/** 歌名 + 歌手：接口返回单曲元信息 */
export async function fetchSongMetaByNameAndArtist(
  name: string,
  artist: string
): Promise<
  | { ok: true; meta: SongMetaPayload }
  | { ok: false; error: string; status: number }
> {
  const url = buildSongMetaApiUrl(name.trim(), artist.trim());
  const res = await fetch(url);
  let data: { success?: boolean; error?: string; data?: SongMetaPayload } = {};
  try {
    data = await res.json();
  } catch {
    return { ok: false, error: "响应不是合法 JSON", status: res.status };
  }
  if (!res.ok || !data.success) {
    return { ok: false, error: data.error || "抓取元信息失败", status: res.status };
  }
  return { ok: true, meta: data.data || {} };
}

/** 将接口返回的 meta 合并进表单（保留 categoryIds） */
export function mergeSongMetaIntoForm(
  prev: AdminSongMetaFormFields,
  meta: SongMetaPayload,
  artistFallback: string
): AdminSongMetaFormFields {
  const artist =
    (typeof meta.artist === "string" && meta.artist.trim()) ||
    artistFallback.trim() ||
    prev.artist;
  return {
    ...prev,
    name: (typeof meta.name === "string" && meta.name.trim()) || prev.name,
    artist,
    album: (typeof meta.album === "string" ? meta.album : "") || prev.album,
    durationSec: String(meta.durationSec ?? prev.durationSec ?? ""),
    releaseDate: String(meta.releaseDate || prev.releaseDate || "").slice(0, 10),
    genre: (typeof meta.genre === "string" ? meta.genre : "") || prev.genre,
    coverUrl: (typeof meta.coverUrl === "string" ? meta.coverUrl : "") || prev.coverUrl,
  };
}

/**
 * 仅歌名时的分支策略：
 * - 无候选 → 失败
 * - 仅 1 位候选 → 直接用该歌手拉取元信息（一步到位）
 * - 多位 → 只返回列表，由前端下拉选择后再拉元信息
 */
export async function resolveArtistsOrSingleSongMeta(name: string): Promise<
  | { mode: "pick"; artists: string[] }
  | { mode: "filled"; meta: SongMetaPayload; lockedArtist: string }
  | { mode: "error"; error: string; status: number }
> {
  const listResult = await fetchArtistsBySongName(name);
  if (!listResult.ok) {
    return { mode: "error", error: listResult.error, status: listResult.status };
  }
  const artists = listResult.artists;
  if (artists.length === 0) {
    return { mode: "error", error: "未找到可选歌手", status: 404 };
  }
  if (artists.length === 1) {
    const lockedArtist = artists[0];
    const metaResult = await fetchSongMetaByNameAndArtist(name, lockedArtist);
    if (!metaResult.ok) {
      return { mode: "error", error: metaResult.error, status: metaResult.status };
    }
    return { mode: "filled", meta: metaResult.meta, lockedArtist };
  }
  return { mode: "pick", artists };
}
