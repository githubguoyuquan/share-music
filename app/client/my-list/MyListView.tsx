"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import SongTimelineList from "../_components/SongTimelineList";
import SongDetailSheet from "../_components/SongDetailSheet";

type Song = {
  id: string;
  name: string;
  artist: string;
  album: string;
  releaseDate?: string;
  genre?: string;
  durationSec?: number;
  qqMusicUrl?: string | null;
  neteaseUrl?: string | null;
  qishuiUrl?: string | null;
  kuwoUrl?: string | null;
};

type Cat = { id: string; name: string; isSystem: boolean; songs: { song: Song; id: string }[] };

export default function MyListView() {
  const router = useRouter();
  const [cats, setCats] = useState<Cat[]>([]);
  const [activeCatId, setActiveCatId] = useState<string>("all");
  const [detailSong, setDetailSong] = useState<Song | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = async () => {
    const res = await fetch("/api/client/user-categories");
    const data = await res.json();
    if (data.success) setCats(data.data);
  };

  useEffect(() => { load(); }, []);

  const allSongs = useMemo(() => {
    const map = new Map<string, Song>();
    for (const c of cats) for (const row of c.songs || []) map.set(row.song.id, row.song);
    return Array.from(map.values());
  }, [cats]);

  const filteredSongs = useMemo(() => {
    if (activeCatId === "all") return allSongs;
    const cat = cats.find((c) => c.id === activeCatId);
    return (cat?.songs || []).map((r) => r.song);
  }, [cats, activeCatId, allSongs]);

  const openDetail = async (songId: string) => {
    setDetailLoading(true);
    setDetailSong(null);
    try {
      const res = await fetch(`/api/client/songs/${songId}`);
      if (!res.ok) { setDetailLoading(false); return; }
      const data = await res.json();
      setDetailLoading(false);
      if (data?.success) setDetailSong(data.data);
    } catch {
      setDetailLoading(false);
    }
  };

  const handleCollect = async (songId: string, categoryId: string) => {
    await fetch("/api/client/user-categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categoryId, songId }),
    });
    await load();
  };

  const handleCreateCategory = async (name: string) => {
    await fetch("/api/client/user-categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    await load();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#060606] to-black p-4 text-zinc-100 md:p-6">
      <div className="sticky top-0 z-20 -mx-4 mb-4 bg-[#060606]/90 px-4 pb-2.5 pt-2.5 backdrop-blur-lg">
        <div className="flex gap-2 overflow-x-auto whitespace-nowrap" style={{ scrollbarWidth: "none", msOverflowStyle: "none", WebkitOverflowScrolling: "touch" }}>
          {(() => {
            const likeCat = cats.find((c) => c.name === "喜欢");
            const rest = cats.filter((c) => c.name !== "喜欢");
            const sorted = likeCat ? [likeCat, ...rest] : rest;
            const items = [
              { key: "all", label: "全部", count: allSongs.length, isLike: false },
              ...sorted.map((c) => ({ key: c.id, label: c.name, count: c.songs.length, isLike: c.name === "喜欢" })),
            ];

            return items.map((item) => {
              const active = activeCatId === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setActiveCatId(item.key)}
                  className={`shrink-0 inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium transition ${
                    active
                      ? "bg-zinc-700 text-zinc-100"
                      : "bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800"
                  }`}
                >
                  {item.isLike && <span className="text-red-500">♥</span>}
                  {item.label}
                  <span className={`text-xs ${active ? "text-zinc-500" : "text-zinc-500"}`}>{item.count}</span>
                </button>
              );
            });
          })()}
        </div>
      </div>

      <SongTimelineList songs={filteredSongs} onOpenDetail={(song) => openDetail(song.id)} emptyText="当前筛选下暂无歌曲。" />

      <SongDetailSheet
        open={Boolean(detailLoading || detailSong)}
        loading={detailLoading}
        song={detailSong}
        categories={cats.map((c) => ({ id: c.id, name: c.name, isSystem: c.isSystem }))}
        authed
        onClose={() => { setDetailSong(null); setDetailLoading(false); }}
        onCollect={handleCollect}
        onCreateCategory={handleCreateCategory}
      />
    </div>
  );
}
