import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/app/lib/auth";

type ITunesTrack = {
  trackName?: string;
  artistName?: string;
  collectionName?: string;
  trackTimeMillis?: number;
  releaseDate?: string;
  primaryGenreName?: string;
  artworkUrl100?: string;
};

function normalize(s: string) {
  return s.trim().toLowerCase();
}

function hasCJK(s?: string) {
  return /[\u4e00-\u9fff]/.test(s || "");
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

async function fetchQQSongs(keyword: string): Promise<QQSong[]> {
  const u = `https://c.y.qq.com/soso/fcgi-bin/client_search_cp?new_json=1&remoteplace=txt.yqq.song&t=0&aggr=1&cr=1&w=${encodeURIComponent(keyword)}&format=json&platform=yqq.json&p=1&n=30`;
  const res = await fetch(u, {
    cache: "no-store",
    headers: {
      referer: "https://y.qq.com/",
      "user-agent": "Mozilla/5.0",
    },
  });
  if (!res.ok) return [];
  const text = await res.text();
  let json: unknown = null;
  try {
    json = JSON.parse(text);
  } catch {
    return [];
  }
  const list = (json as { data?: { song?: { list?: QQSong[] } } })?.data?.song?.list;
  return Array.isArray(list) ? list : [];
}

export async function GET(req: NextRequest) {
  if (!requireAdmin(req)) return NextResponse.json({ success: false, error: "无权限" }, { status: 403 });

  const name = String(req.nextUrl.searchParams.get("name") || "").trim();
  const artist = String(req.nextUrl.searchParams.get("artist") || "").trim();
  if (!name) return NextResponse.json({ success: false, error: "歌曲名不能为空" }, { status: 400 });

  try {
    if (!artist) {
      const qq = await fetchQQSongs(name);
      const qqArtists = Array.from(
        new Set(
          qq
            .flatMap((s) => (Array.isArray(s.singer) ? s.singer : []))
            .map((x) => (x.name || "").trim())
            .filter(Boolean)
        )
      );
      if (qqArtists.length) {
        const zhFirst = [...qqArtists].sort((a, b) => Number(hasCJK(b)) - Number(hasCJK(a)));
        return NextResponse.json({ success: true, data: { artists: zhFirst } });
      }

      const u = `https://itunes.apple.com/search?term=${encodeURIComponent(name)}&entity=song&limit=40`;
      const res = await fetch(u, { cache: "no-store" });
      if (!res.ok) return NextResponse.json({ success: false, error: "抓取歌手失败" }, { status: 502 });
      const data = await res.json();
      const results: ITunesTrack[] = Array.isArray(data?.results) ? data.results : [];
      const uniq = Array.from(new Set(results.map((r) => (r.artistName || "").trim()).filter(Boolean))).sort((a, b) => Number(hasCJK(b)) - Number(hasCJK(a)));
      return NextResponse.json({ success: true, data: { artists: uniq } });
    }

    const qq = await fetchQQSongs(`${name} ${artist}`);
    const nName = normalize(name);
    const nArtist = normalize(artist);
    const qqPicked =
      qq.find((r) => (r.singer || []).some((s) => normalize(s.name || "") === nArtist) && normalize(r.songname || "").includes(nName)) ||
      qq.find((r) => (r.singer || []).some((s) => normalize(s.name || "").includes(nArtist))) ||
      qq.find((r) => (r.singer || []).some((s) => hasCJK(s.name)));
    if (qqPicked) {
      const artistName = (qqPicked.singer || []).map((s) => s.name).filter(Boolean).join(" / ") || artist;
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

    const u = `https://itunes.apple.com/search?term=${encodeURIComponent(`${name} ${artist}`)}&entity=song&limit=25`;
    const res = await fetch(u, { cache: "no-store" });
    if (!res.ok) return NextResponse.json({ success: false, error: "抓取元信息失败" }, { status: 502 });
    const data = await res.json();
    const results: ITunesTrack[] = Array.isArray(data?.results) ? data.results : [];

    const iName = normalize(name);
    const iArtist = normalize(artist);
    const picked =
      results.find((r) => normalize(r.artistName || "") === iArtist && normalize(r.trackName || "").includes(iName)) ||
      results.find((r) => normalize(r.artistName || "").includes(iArtist)) ||
      results[0];

    if (!picked) return NextResponse.json({ success: false, error: "未找到匹配元信息" }, { status: 404 });

    return NextResponse.json({
      success: true,
      data: {
        name: picked.trackName || name,
        artist: picked.artistName || artist,
        album: picked.collectionName || "",
        durationSec: picked.trackTimeMillis ? Math.max(1, Math.round(picked.trackTimeMillis / 1000)) : "",
        releaseDate: picked.releaseDate ? picked.releaseDate.slice(0, 10) : "",
        genre: picked.primaryGenreName || "",
        coverUrl: picked.artworkUrl100 ? picked.artworkUrl100.replace("100x100", "600x600") : "",
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: "网络抓取失败" }, { status: 500 });
  }
}
