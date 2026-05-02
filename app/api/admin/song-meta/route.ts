import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/app/lib/auth";

const FETCH_MS = 14_000;

type ITunesTrack = {
  trackName?: string;
  artistName?: string;
  collectionName?: string;
  trackTimeMillis?: number;
  releaseDate?: string;
  primaryGenreName?: string;
  artworkUrl100?: string;
};

type DeezerTrack = {
  title?: string;
  duration?: number;
  release_date?: string;
  artist?: { name?: string };
  album?: { title?: string; cover_medium?: string; cover_xl?: string };
};

type NeteaseSong = {
  name?: string;
  duration?: number;
  artists?: { name?: string }[];
  album?: { name?: string; publishTime?: number };
};

function normalize(s: unknown) {
  return String(s ?? "").trim().toLowerCase();
}

function hasCJK(s?: string) {
  return /[\u4e00-\u9fff]/.test(s || "");
}

function parseJsonSafe(text: string): unknown | null {
  const t = text.trim();
  if (!t) return null;
  try {
    return JSON.parse(t);
  } catch {
    const start = t.indexOf("{");
    const end = t.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(t.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

async function fetchBody(url: string, headers?: Record<string, string>): Promise<{ ok: boolean; status: number; text: string }> {
  const ctrl = new AbortController();
  const tid = setTimeout(() => ctrl.abort(), FETCH_MS);
  try {
    const res = await fetch(url, {
      cache: "no-store",
      signal: ctrl.signal,
      headers: { "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36", ...headers },
    });
    const text = await res.text();
    return { ok: res.ok, status: res.status, text };
  } catch {
    return { ok: false, status: 0, text: "" };
  } finally {
    clearTimeout(tid);
  }
}

type QQSinger = { name?: string };
type QQSong = {
  songname?: string;
  singer?: QQSinger[] | QQSinger;
  albumname?: string;
  interval?: number;
  time_public?: string;
  albummid?: string;
};

function qqSingerList(song: QQSong): QQSinger[] {
  const s = song.singer;
  if (Array.isArray(s)) return s;
  if (s && typeof s === "object") return [s as QQSinger];
  return [];
}

async function fetchQQSongs(keyword: string): Promise<QQSong[]> {
  const u = `https://c.y.qq.com/soso/fcgi-bin/client_search_cp?new_json=1&remoteplace=txt.yqq.song&t=0&aggr=1&cr=1&w=${encodeURIComponent(keyword)}&format=json&platform=yqq.json&p=1&n=30`;
  try {
    const { ok, text } = await fetchBody(u, { referer: "https://y.qq.com/" });
    if (!ok || !text) return [];
    const json = parseJsonSafe(text);
    if (!json || typeof json !== "object") return [];
    const list = (json as { data?: { song?: { list?: QQSong[] } } }).data?.song?.list;
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

async function fetchNeteaseSongs(keyword: string): Promise<NeteaseSong[]> {
  const url = `https://music.163.com/api/search/get/web?csrf_token=&type=1&s=${encodeURIComponent(keyword)}&limit=30`;
  const { ok, text } = await fetchBody(url, { referer: "https://music.163.com/" });
  if (!ok || !text) return [];
  const data = parseJsonSafe(text) as { result?: { songs?: NeteaseSong[] }; msg?: string } | null;
  const songs = data?.result?.songs;
  return Array.isArray(songs) ? songs : [];
}

async function fetchITunesTracks(term: string, limit: number): Promise<ITunesTrack[]> {
  for (const country of ["cn", "hk", "us"]) {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=song&limit=${limit}&country=${country}`;
    const { ok, text } = await fetchBody(url);
    if (!ok || !text) continue;
    const data = parseJsonSafe(text) as { results?: ITunesTrack[] } | null;
    const results = Array.isArray(data?.results) ? data.results : [];
    if (results.length) return results;
  }
  return [];
}

async function deezerSearchTracks(q: string): Promise<DeezerTrack[]> {
  const url = `https://api.deezer.com/search/track?q=${encodeURIComponent(q)}`;
  const { ok, text } = await fetchBody(url);
  if (!ok || !text) return [];
  const data = parseJsonSafe(text) as { data?: DeezerTrack[] } | null;
  return Array.isArray(data?.data) ? data.data : [];
}

function zhSortArtists(names: string[]): string[] {
  return [...names].sort((a, b) => Number(hasCJK(b)) - Number(hasCJK(a)));
}

function neteaseArtistNames(s: NeteaseSong): string[] {
  const raw = Array.isArray(s.artists) ? s.artists : [];
  return raw.map((a) => String(a.name ?? "").trim()).filter(Boolean);
}

function uniqArtistsFromNetease(songs: NeteaseSong[]): string[] {
  return Array.from(new Set(songs.flatMap((s) => neteaseArtistNames(s))));
}

function uniqArtistsFromQQ(qq: QQSong[]): string[] {
  return Array.from(
    new Set(qq.flatMap((s) => qqSingerList(s)).map((x) => String(x.name ?? "").trim()).filter(Boolean))
  );
}

function uniqArtistsFromItunes(results: ITunesTrack[]): string[] {
  return Array.from(new Set(results.map((r) => String(r.artistName ?? "").trim()).filter(Boolean)));
}

function uniqArtistsFromDeezer(tracks: DeezerTrack[]): string[] {
  return Array.from(new Set(tracks.map((t) => String(t.artist?.name ?? "").trim()).filter(Boolean)));
}

function pickQQSong(qq: QQSong[], name: string, artist: string): QQSong | null {
  const nName = normalize(name);
  const nArtist = normalize(artist);
  const picked =
    qq.find((r) => qqSingerList(r).some((s) => normalize(s.name) === nArtist) && normalize(r.songname).includes(nName)) ||
    qq.find((r) => qqSingerList(r).some((s) => normalize(s.name).includes(nArtist))) ||
    qq.find((r) => qqSingerList(r).some((s) => hasCJK(String(s.name))));
  return picked ?? null;
}

function pickNeteaseSong(songs: NeteaseSong[], name: string, artist: string): NeteaseSong | null {
  const nName = normalize(name);
  const nArtist = normalize(artist);
  const namesOf = (s: NeteaseSong) => neteaseArtistNames(s).map((x) => normalize(x));

  const picked =
    songs.find((s) => namesOf(s).some((na) => na === nArtist) && normalize(s.name).includes(nName)) ||
    songs.find((s) => namesOf(s).some((na) => na.includes(nArtist))) ||
    songs.find((s) => normalize(s.name).includes(nName)) ||
    songs[0];

  return picked ?? null;
}

function pickITunesTrack(results: ITunesTrack[], name: string, artist: string): ITunesTrack | null {
  const iName = normalize(name);
  const iArtist = normalize(artist);
  const picked =
    results.find((r) => normalize(r.artistName) === iArtist && normalize(r.trackName).includes(iName)) ||
    results.find((r) => normalize(r.artistName).includes(iArtist)) ||
    results[0];
  return picked ?? null;
}

function pickDeezerTrack(tracks: DeezerTrack[], name: string, artist: string): DeezerTrack | null {
  const nName = normalize(name);
  const nArtist = normalize(artist);
  const picked =
    tracks.find((t) => normalize(t.artist?.name) === nArtist && normalize(t.title).includes(nName)) ||
    tracks.find((t) => normalize(t.artist?.name).includes(nArtist) && normalize(t.title).includes(nName)) ||
    tracks.find((t) => normalize(t.artist?.name).includes(nArtist)) ||
    tracks[0];
  return picked ?? null;
}

function deezerCoverUrl(t: DeezerTrack): string {
  const a = t.album;
  if (!a) return "";
  return String(a.cover_xl || a.cover_medium || "").trim();
}

function deezerReleaseSlice(t: DeezerTrack): string {
  const r = t.release_date;
  if (typeof r === "string" && /^\d{4}-\d{2}-\d{2}/.test(r)) return r.slice(0, 10);
  return "";
}

function neteasePublishSlice(t?: number): string {
  if (typeof t !== "number" || t <= 0) return "";
  const iso = new Date(t).toISOString().slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso : "";
}

export async function GET(req: NextRequest) {
  if (!requireAdmin(req)) return NextResponse.json({ success: false, error: "无权限" }, { status: 403 });

  const name = String(req.nextUrl.searchParams.get("name") || "").trim();
  const artist = String(req.nextUrl.searchParams.get("artist") || "").trim();
  if (!name) return NextResponse.json({ success: false, error: "歌曲名不能为空" }, { status: 400 });

  try {
    if (!artist) {
      const qq = await fetchQQSongs(name);
      const fromQQ = uniqArtistsFromQQ(qq);
      if (fromQQ.length) {
        return NextResponse.json({ success: true, data: { artists: zhSortArtists(fromQQ) } });
      }

      const ne = await fetchNeteaseSongs(name);
      const fromNe = uniqArtistsFromNetease(ne);
      if (fromNe.length) {
        return NextResponse.json({ success: true, data: { artists: zhSortArtists(fromNe) } });
      }

      const itunes = await fetchITunesTracks(name, 40);
      const fromItunes = uniqArtistsFromItunes(itunes);
      if (fromItunes.length) {
        return NextResponse.json({ success: true, data: { artists: zhSortArtists(fromItunes) } });
      }

      const dz = await deezerSearchTracks(name);
      const fromDz = uniqArtistsFromDeezer(dz);
      if (fromDz.length) {
        return NextResponse.json({ success: true, data: { artists: zhSortArtists(fromDz) } });
      }

      return NextResponse.json(
        {
          success: false,
          error: "未找到可选歌手（QQ/网易云/iTunes 均无结果或当前网络无法访问这些服务）",
          data: { artists: [] },
        },
        { status: 404 }
      );
    }

    const qq = await fetchQQSongs(`${name} ${artist}`);
    const qqPicked = pickQQSong(qq, name, artist);
    if (qqPicked) {
      const artistName = qqSingerList(qqPicked).map((s) => s.name).filter(Boolean).join(" / ") || artist;
      const coverUrl = qqPicked.albummid ? `https://y.gtimg.cn/music/photo_new/T002R800x800M000${qqPicked.albummid}.jpg` : "";
      return NextResponse.json({
        success: true,
        data: {
          name: qqPicked.songname || name,
          artist: artistName,
          album: qqPicked.albumname || "",
          durationSec: qqPicked.interval ? Math.max(1, Number(qqPicked.interval)) : "",
          releaseDate: qqPicked.time_public || "",
          genre: "",
          coverUrl,
        },
      });
    }

    const neSongs = await fetchNeteaseSongs(`${name} ${artist}`);
    let nePicked = pickNeteaseSong(neSongs, name, artist);
    if (!nePicked) {
      const neLoose = await fetchNeteaseSongs(name);
      nePicked = pickNeteaseSong(neLoose, name, artist);
    }
    if (nePicked) {
      const artistLine = neteaseArtistNames(nePicked).join(" / ") || artist;
      const durMs = typeof nePicked.duration === "number" ? nePicked.duration : 0;
      return NextResponse.json({
        success: true,
        data: {
          name: nePicked.name || name,
          artist: artistLine,
          album: nePicked.album?.name || "",
          durationSec: durMs > 0 ? Math.max(1, Math.round(durMs / 1000)) : "",
          releaseDate: neteasePublishSlice(nePicked.album?.publishTime),
          genre: "",
          coverUrl: "",
        },
      });
    }

    const itunesResults = await fetchITunesTracks(`${name} ${artist}`, 25);
    const iPicked = pickITunesTrack(itunesResults, name, artist);
    if (iPicked) {
      const rd = iPicked.releaseDate && typeof iPicked.releaseDate === "string" ? iPicked.releaseDate.slice(0, 10) : "";
      return NextResponse.json({
        success: true,
        data: {
          name: iPicked.trackName || name,
          artist: iPicked.artistName || artist,
          album: iPicked.collectionName || "",
          durationSec: iPicked.trackTimeMillis ? Math.max(1, Math.round(iPicked.trackTimeMillis / 1000)) : "",
          releaseDate: rd,
          genre: iPicked.primaryGenreName || "",
          coverUrl: iPicked.artworkUrl100 ? iPicked.artworkUrl100.replace("100x100", "600x600") : "",
        },
      });
    }

    const dzTracks = await deezerSearchTracks(`${name} ${artist}`);
    const dPicked = pickDeezerTrack(dzTracks, name, artist);
    if (dPicked) {
      return NextResponse.json({
        success: true,
        data: {
          name: dPicked.title || name,
          artist: dPicked.artist?.name || artist,
          album: dPicked.album?.title || "",
          durationSec: typeof dPicked.duration === "number" && dPicked.duration > 0 ? dPicked.duration : "",
          releaseDate: deezerReleaseSlice(dPicked),
          genre: "",
          coverUrl: deezerCoverUrl(dPicked),
        },
      });
    }

    return NextResponse.json({ success: false, error: "未找到匹配元信息" }, { status: 404 });
  } catch (err) {
    console.error("[admin/song-meta]", err);
    return NextResponse.json({ success: false, error: "检索处理失败，请稍后重试" }, { status: 500 });
  }
}
