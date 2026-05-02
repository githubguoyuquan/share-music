import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/app/lib/auth";

/**
 * 后台「智能抓取」链路（与 app/lib/admin-song-meta.ts、admin/songs 表单联动）
 *
 * 1. 浏览器：`resolveArtistsOrSingleSongMeta(歌名)` 或 `fetchSongMetaByNameAndArtist(歌名, 歌手)`
 * 2. GET `/api/admin/song-meta?name=&artist`（需管理员 Cookie）
 *    - 无 `artist`：仅 QQ 音乐搜索 → 聚合歌手候选
 *    - 有 `artist`：QQ 搜「歌名+歌手」→ 严格匹配优先；否则在同一批结果中按「歌名包含 + 汉字偏好」择优；仍无则仅用歌名再搜一轮同逻辑
 * 3. 数据源仅为 QQ；若服务器出口被 QQ 拦截会得到空列表（此前若叠加 iTunes 兜底会感觉「以前能用」）。
 */

/** QQ occasionally return non-strings; coerce before string ops. */
function normalize(s: unknown) {
  return String(s ?? "").trim().toLowerCase();
}

function safeTrim(s: unknown) {
  return String(s ?? "").trim();
}

function hasCJK(s?: unknown) {
  return /[\u4e00-\u9fff]/.test(String(s ?? ""));
}

type QQSinger = { name?: string };
type QQSong = {
  songname?: string;
  singer?: QQSinger[];
  albumname?: string;
  interval?: number;
  time_public?: string;
  albummid?: string;
};

/** QQ 不同版本接口里曲名 / 歌手字段名不一致，尽量都做兼容。 */
function pickFirstNonEmptyString(...vals: unknown[]): string {
  for (const v of vals) {
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

function normalizeSingerEntry(entry: unknown): QQSinger | null {
  if (entry == null || typeof entry !== "object") return null;
  const e = entry as Record<string, unknown>;
  const name = pickFirstNonEmptyString(e.name, e.title, e.singer_name, e.singername);
  return name ? { name } : null;
}

function singersFromRaw(raw: unknown): QQSinger[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.map(normalizeSingerEntry).filter(Boolean) as QQSinger[];
  }
  if (typeof raw === "object") {
    const one = normalizeSingerEntry(raw);
    return one ? [one] : [];
  }
  return [];
}

function normalizeQQSongRow(raw: unknown): QQSong | null {
  if (raw == null || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;

  const songNest = o.song && typeof o.song === "object" ? (o.song as Record<string, unknown>) : null;
  const albumNest = o.album && typeof o.album === "object" ? (o.album as Record<string, unknown>) : null;

  const songname = pickFirstNonEmptyString(
    o.songname,
    o.title,
    o.name,
    songNest?.title,
    songNest?.name,
  );
  const albumname = pickFirstNonEmptyString(
    o.albumname,
    albumNest?.title,
    albumNest?.name,
  );

  const singerRaw =
    o.singer ??
    o.singers ??
    (o as { singer_list?: unknown }).singer_list ??
    songNest?.singer;

  const singers = singersFromRaw(singerRaw);

  const intervalRaw = o.interval ?? songNest?.interval ?? (o as { duration?: unknown }).duration;
  const interval =
    typeof intervalRaw === "number"
      ? intervalRaw
      : typeof intervalRaw === "string"
        ? Number(intervalRaw)
        : undefined;

  const time_public = pickFirstNonEmptyString(
    o.time_public,
    (o as { publish_date?: string }).publish_date,
    songNest?.time_public as string | undefined,
  );

  const albummid = pickFirstNonEmptyString(
    o.albummid,
    typeof albumNest?.mid === "string" ? albumNest.mid : "",
    (albumNest as { albummid?: string } | null)?.albummid,
  );

  if (!songname && singers.length === 0) return null;

  return {
    songname: songname || undefined,
    singer: singers,
    albumname: albumname || undefined,
    interval: Number.isFinite(interval) ? interval : undefined,
    time_public: time_public || undefined,
    albummid: albummid || undefined,
  };
}

/** 兼容 JSONP 包裹与多层路径下的歌曲列表。 */
function parseQQSearchPayload(text: string): unknown | null {
  let t = text.trim().replace(/^\ufeff/, "");
  if (!t) return null;
  const jsonpPrefix = /^\w+\s*\(/;
  if (jsonpPrefix.test(t)) {
    const open = t.indexOf("(");
    const close = t.lastIndexOf(")");
    if (open >= 0 && close > open) t = t.slice(open + 1, close).trim();
  }
  try {
    return JSON.parse(t) as unknown;
  } catch {
    return null;
  }
}

function extractQQSongList(json: unknown): unknown[] {
  const root = json as Record<string, unknown> | null;
  if (!root) return [];

  const data = root.data as Record<string, unknown> | undefined;
  if (data && typeof data === "object") {
    const song = data.song as Record<string, unknown> | undefined;
    if (song && Array.isArray(song.list)) return song.list;
    const songs = data.songs;
    if (Array.isArray(songs)) return songs;
    const songlist = data.songlist;
    if (Array.isArray(songlist)) return songlist;
  }

  const songRoot = root.song as Record<string, unknown> | undefined;
  if (songRoot && Array.isArray(songRoot.list)) return songRoot.list;

  return [];
}

/** Prefer rows with Chinese titles/artists when match tier is equal (reduces pinyin-only picks). */
function qqPickScore(r: QQSong, nName: string, nArtist: string): number {
  const singers = singersFromRaw(r.singer);
  const names = singers.map((s) => normalize(s.name || ""));
  const songN = normalize(r.songname || "");
  const artistExact = names.some((n) => n === nArtist);
  const artistInc = names.some((n) => n.includes(nArtist));
  const songInc = songN.includes(nName);
  let tier = 0;
  if (artistExact && songInc) tier = 4;
  else if (artistExact) tier = 3;
  else if (artistInc && songInc) tier = 2;
  else if (artistInc) tier = 1;
  const zhBonus =
    (hasCJK(r.songname) ? 1000 : 0) + singers.reduce((acc, s) => acc + (hasCJK(s.name) ? 500 : 0), 0);
  return tier * 10000 + zhBonus;
}

function qqMatchTier(r: QQSong, nName: string, nArtist: string): number {
  return Math.floor(qqPickScore(r, nName, nArtist) / 10000);
}

/** 至少 loosen artist：tier≥1（与原逻辑一致）。 */
function pickBestQQSong(qq: QQSong[], nName: string, nArtist: string): QQSong | undefined {
  const matched = qq.filter((r) => qqMatchTier(r, nName, nArtist) >= 1);
  if (!matched.length) return undefined;
  return [...matched].sort((a, b) => qqPickScore(b, nName, nArtist) - qqPickScore(a, nName, nArtist))[0];
}

/**
 * 严格匹配无果时：仅在「曲目标题包含歌名」的子集中按 qqPickScore 择优（保留汉字加权），
 * 替代原先走 iTunes 的兜底。
 */
function pickQQSongByTitleFallback(qq: QQSong[], nName: string, nArtist: string): QQSong | undefined {
  const titleHits = qq.filter((r) => normalize(r.songname || "").includes(nName));
  if (!titleHits.length) return undefined;
  return [...titleHits].sort((a, b) => qqPickScore(b, nName, nArtist) - qqPickScore(a, nName, nArtist))[0];
}

async function resolveQQSongForMeta(name: string, artist: string): Promise<QQSong | undefined> {
  const nName = normalize(name);
  const nArtist = normalize(artist);

  const tryList = (qq: QQSong[]) =>
    pickBestQQSong(qq, nName, nArtist) ?? pickQQSongByTitleFallback(qq, nName, nArtist);

  let qq = await fetchQQSongs(`${name} ${artist}`);
  let picked = tryList(qq);
  if (picked) return picked;

  qq = await fetchQQSongs(name);
  picked = tryList(qq);
  return picked;
}

/** Artists from tracks that already have CJK metadata first (often 汉字歌手 vs 拼音 duplicate rows). */
function orderedQQArtistNames(qq: QQSong[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  const push = (raw: unknown) => {
    const t = safeTrim(raw);
    if (!t || seen.has(t)) return;
    seen.add(t);
    out.push(t);
  };
  const rowHasZh = (s: QQSong) =>
    hasCJK(s.songname) || singersFromRaw(s.singer).some((x) => hasCJK(x.name));
  for (const s of qq) {
    if (!rowHasZh(s)) continue;
    for (const x of singersFromRaw(s.singer)) push(x.name || "");
  }
  for (const s of qq) {
    for (const x of singersFromRaw(s.singer)) push(x.name || "");
  }
  return out.sort((a, b) => Number(hasCJK(b)) - Number(hasCJK(a)));
}

function buildQQSearchUrl(keyword: string, page: number, pageSize: number): string {
  const base = "https://c.y.qq.com/soso/fcgi-bin/client_search_cp";
  const ps = new URLSearchParams({
    new_json: "1",
    remoteplace: "txt.yqq.song",
    t: "0",
    aggr: "1",
    cr: "1",
    lossless: "0",
    flag_qc: "0",
    platform: "yqq.json",
    format: "json",
    inCharset: "utf8",
    outCharset: "utf-8",
    notice: "0",
    needNewCode: "0",
    ct: "24",
    qqmusic_ver: "1298",
    cv: "4747474",
    p: String(page),
    n: String(pageSize),
    w: keyword,
  });
  return `${base}?${ps.toString()}`;
}

async function fetchQQSongsOnce(url: string): Promise<{ rows: QQSong[]; rawCode?: number; rawMessage?: string }> {
  const res = await fetch(url, {
    cache: "no-store",
    headers: {
      referer: "https://y.qq.com/",
      origin: "https://y.qq.com",
      accept: "application/json, text/plain, */*",
      "accept-language": "zh-CN,zh;q=0.9,en;q=0.8",
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    },
  });
  if (!res.ok) {
    console.warn("[fetchQQSongs] HTTP", res.status, url.slice(0, 120));
    return { rows: [] };
  }
  const text = await res.text();
  const json = parseQQSearchPayload(text);
  if (!json) {
    console.warn("[fetchQQSongs] JSON parse failed, head:", text.slice(0, 200));
    return { rows: [] };
  }
  const root = json as { code?: number; message?: string };
  if (root.code !== undefined && root.code !== 0) {
    console.warn("[fetchQQSongs] QQ code", root.code, root.message);
  }
  const list = extractQQSongList(json);
  const out: QQSong[] = [];
  for (const item of list) {
    const row = normalizeQQSongRow(item);
    if (row) out.push(row);
  }
  return { rows: out, rawCode: root.code, rawMessage: root.message };
}

/** 先走新版参数；若结果为空再试精简参数（部分网络环境下行为不一致）。 */
async function fetchQQSongs(keyword: string): Promise<QQSong[]> {
  try {
    const primary = buildQQSearchUrl(keyword, 1, 40);
    let { rows } = await fetchQQSongsOnce(primary);
    if (rows.length) return rows;

    const fallbackUrl =
      `https://c.y.qq.com/soso/fcgi-bin/client_search_cp?new_json=1&remoteplace=txt.yqq.song&t=0&aggr=1&cr=1&w=${encodeURIComponent(keyword)}` +
      `&format=json&platform=yqq.json&p=1&n=40`;
    ({ rows } = await fetchQQSongsOnce(fallbackUrl));
    return rows;
  } catch (e) {
    console.error("[fetchQQSongs]", e);
    return [];
  }
}

export async function GET(req: NextRequest) {
  if (!requireAdmin(req)) return NextResponse.json({ success: false, error: "无权限" }, { status: 403 });

  const name = String(req.nextUrl.searchParams.get("name") || "").trim();
  const artist = String(req.nextUrl.searchParams.get("artist") || "").trim();
  if (!name) return NextResponse.json({ success: false, error: "歌曲名不能为空" }, { status: 400 });

  try {
    if (!artist) {
      const qq = await fetchQQSongs(name);
      const qqArtists = orderedQQArtistNames(qq);
      if (!qqArtists.length) {
        return NextResponse.json(
          {
            success: false,
            error:
              "QQ 音乐未返回匹配曲目或歌手。若在服务器或 Docker 内部署，请确认出站可访问 y.qq.com；也可在本机开发环境重试。仍无效时请手动填写歌手。",
          },
          { status: 404 },
        );
      }
      return NextResponse.json({ success: true, data: { artists: qqArtists } });
    }

    const qqPicked = await resolveQQSongForMeta(name, artist);
    if (!qqPicked) {
      return NextResponse.json(
        { success: false, error: "QQ 音乐未匹配到该曲目的元信息，请核对歌名与歌手或手动填写" },
        { status: 404 },
      );
    }

    const artistName =
      (qqPicked.singer || []).map((s) => safeTrim(s.name)).filter(Boolean).join(" / ") || artist;
    const coverUrl = qqPicked.albummid ? `https://y.gtimg.cn/music/photo_new/T002R800x800M000${qqPicked.albummid}.jpg` : "";
    const qqSec = Number(qqPicked.interval);
    const durationSec = Number.isFinite(qqSec) && qqSec > 0 ? Math.max(1, Math.round(qqSec)) : "";

    return NextResponse.json({
      success: true,
      data: {
        name: qqPicked.songname || name,
        artist: artistName,
        album: qqPicked.albumname || "",
        durationSec,
        releaseDate: qqPicked.time_public || "",
        genre: "",
        coverUrl,
      },
    });
  } catch (err) {
    console.error("[admin/song-meta]", err);
    const payload: {
      success: false;
      error: string;
      debug?: string;
    } = {
      success: false,
      error: "检索失败（服务器异常，详见日志 [admin/song-meta]）",
    };
    if (process.env.NODE_ENV === "development" && err instanceof Error && err.message) {
      payload.debug = err.message;
    }
    return NextResponse.json(payload, { status: 500 });
  }
}
