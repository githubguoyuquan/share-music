"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../AuthContext";
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

const myListViewCache: {
  loaded: boolean;
  hydrated: boolean;
  cats: Cat[];
  activeCatId: string;
} = {
  loaded: false,
  hydrated: false,
  cats: [],
  activeCatId: "all",
};

export default function MyListView() {
  const router = useRouter();
  const { checked: authChecked, user } = useAuth();
  const [cats, setCats] = useState<Cat[]>([]);
  const [activeCatId, setActiveCatId] = useState<string>("all");
  const [detailSong, setDetailSong] = useState<Song | null>(null);
  const hydratedRef = useRef(false);

  useEffect(() => {
    if (!myListViewCache.loaded || !myListViewCache.hydrated) return;
    setCats(myListViewCache.cats);
    setActiveCatId(myListViewCache.activeCatId);
  }, []);

  useEffect(() => {
    return () => {
      myListViewCache.loaded = true;
      myListViewCache.hydrated = hydratedRef.current;
      myListViewCache.cats = cats;
      myListViewCache.activeCatId = activeCatId;
    };
  }, [cats, activeCatId]);

  const load = useCallback(async () => {
    const res = await fetch("/api/client/user-categories");
    if (!res.ok) return;
    const data = await res.json();
    if (data.success) {
      hydratedRef.current = true;
      setCats(data.data);
    }
  }, []);

  useEffect(() => {
    if (!authChecked || !user) return;
    if (myListViewCache.loaded && myListViewCache.hydrated) return;
    load();
  }, [authChecked, user, load]);

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
  const favoriteSongIds = useMemo(() => {
    const like = cats.find((c) => c.name === "喜欢");
    return (like?.songs || []).map((r) => r.song.id);
  }, [cats]);
  const visibleCats = useMemo(() => cats.filter((c) => (c.songs?.length || 0) > 0), [cats]);

  const categoryTabItems = useMemo(
    () => [
      { key: "all", label: "全部", count: allSongs.length, isLike: false },
      ...visibleCats.map((c) => ({
        key: c.id,
        label: c.name,
        count: c.songs.length,
        isLike: c.name === "喜欢",
      })),
    ],
    [allSongs.length, visibleCats]
  );

  const detailSheetCategories = useMemo(
    () => cats.map((c) => ({ id: c.id, name: c.name, isSystem: c.isSystem })),
    [cats]
  );

  useEffect(() => {
    if (activeCatId === "all") return;
    if (!visibleCats.some((c) => c.id === activeCatId)) setActiveCatId("all");
  }, [activeCatId, visibleCats]);

  const openDetail = useCallback((song: Song) => {
    setDetailSong(song);
  }, []);

  const handleCollect = useCallback(
    async (songId: string, categoryId: string) => {
      await fetch("/api/client/user-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryId, songId }),
      });
      await load();
    },
    [load]
  );

  const handleCreateCategory = useCallback(
    async (name: string) => {
      await fetch("/api/client/user-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      await load();
    },
    [load]
  );

  const handleQuickUnfavorite = useCallback(
    async (song: Song) => {
      const res = await fetch("/api/client/favorites", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ songId: song.id }),
      });
      if (!res.ok) return;
      await load();
    },
    [load]
  );

  if (!authChecked) {
    return (
      <div className="min-h-[calc(100dvh-5rem)] bg-gradient-to-b from-[#060606] to-black p-4 md:p-6">
        <div className="mb-4 h-10 animate-pulse rounded-full bg-zinc-800/40" />
        <div className="space-y-3">{[1,2,3].map((i) => <div key={i} className="h-20 animate-pulse rounded-2xl bg-zinc-800/30" />)}</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-[calc(100dvh-5rem)] flex-col items-center justify-center bg-gradient-to-b from-[#060606] to-black p-4">
        <p className="mb-4 text-sm text-zinc-400">请先登录查看收藏</p>
        <button type="button" onClick={() => router.push("/client/auth?next=/client/my-list")} className="rounded-xl bg-red-600 px-6 py-2.5 text-sm font-medium text-white">登录 / 注册</button>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100dvh-5rem)] bg-gradient-to-b from-[#060606] to-black p-4 text-zinc-100 md:p-6">
      <div className="sticky top-0 z-20 -mx-4 mb-4 bg-[#060606]/90 px-4 pb-2.5 pt-2.5 backdrop-blur-lg">
        <div className="flex gap-2 overflow-x-auto whitespace-nowrap" style={{ scrollbarWidth: "none", msOverflowStyle: "none", WebkitOverflowScrolling: "touch" }}>
          {categoryTabItems.map((item) => {
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
          })}
        </div>
      </div>

      <div>
        <SongTimelineList
          songs={filteredSongs}
          onOpenDetail={openDetail}
          emptyText="当前筛选下暂无歌曲。"
          stickyTopClass="top-12"
          swipeMode="unfavorite-left"
          onSwipeLeft={handleQuickUnfavorite}
          unfavoriteVisual="slide-out"
          favoriteSongIds={favoriteSongIds}
          showFavoriteBackground={false}
        />
      </div>

      <SongDetailSheet
        open={Boolean(detailSong)}
        loading={false}
        song={detailSong}
        categories={detailSheetCategories}
        authed
        onClose={() => { setDetailSong(null); }}
        onCollect={handleCollect}
        onCreateCategory={handleCreateCategory}
      />
    </div>
  );
}
