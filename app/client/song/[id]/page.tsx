"use client";

import { use, useEffect, useState } from "react";

type Song = { id: string; name: string; artist: string; album: string; genre: string; qqMusicUrl?: string | null; neteaseUrl?: string | null; qishuiUrl?: string | null; kuwoUrl?: string | null };

export default function SongDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [song, setSong] = useState<Song | null>(null);

  useEffect(() => {
    fetch(`/api/client/songs/${id}`).then((r) => r.json()).then((d) => d.success && setSong(d.data));
  }, [id]);

  if (!song) return <div className="min-h-screen bg-black text-zinc-100 p-6">加载中...</div>;

  const links = [
    ["QQ音乐", song.qqMusicUrl, "https://y.qq.com"],
    ["网易云", song.neteaseUrl, "https://music.163.com"],
    ["汽水音乐", song.qishuiUrl, "https://www.douyin.com"],
    ["酷我音乐", song.kuwoUrl, "https://www.kuwo.cn"],
  ] as const;

  return (
    <div className="min-h-screen bg-black text-zinc-100 p-6">
      <h1 className="text-3xl font-bold">{song.name}</h1>
      <p className="text-zinc-400 mt-2">{song.artist} · {song.album} · {song.genre}</p>
      <div className="mt-6 grid sm:grid-cols-2 gap-3">
        {links.map(([label, appUrl, webUrl]) => (
          <a key={label} href={appUrl || webUrl} className="rounded bg-red-600 px-4 py-3 text-center font-medium">在{label}播放</a>
        ))}
      </div>
    </div>
  );
}
