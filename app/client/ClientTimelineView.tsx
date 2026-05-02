"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthContext";
import SongTimelineList from "./_components/SongTimelineList";
import SongDetailSheet from "./_components/SongDetailSheet";

type Song = {
  id: string;
  name: string;
  artist: string;
  album: string;
  coverUrl?: string | null;
  genre?: string;
  durationSec?: number;
  releaseDate?: string;
  qqMusicUrl?: string | null;
  neteaseUrl?: string | null;
  qishuiUrl?: string | null;
  kuwoUrl?: string | null;
  categories?: { category: { id: string; name: string; parentId?: string | null } }[];
};
type UserCategory = { id: string; name: string; isSystem: boolean; songs?: { songId?: string; song?: { id: string } }[] };
type HomeCategory = { id: string; name: string; color?: string | null; parentId?: string | null };

const timelineViewCache: {
  loaded: boolean;
  hydrated: boolean;
  songs: Song[];
  favoriteSongIds: string[];
  categories: UserCategory[];
  homeCategories: HomeCategory[];
  page: number;
  totalPages: number;
  activeParentId: string;
  activeChildId: string | null;
  activeGenre: string | null;
  showTopBtn: boolean;
} = {
  loaded: false,
  hydrated: false,
  songs: [],
  favoriteSongIds: [],
  categories: [],
  homeCategories: [],
  page: 1,
  totalPages: 1,
  activeParentId: "all",
  activeChildId: null,
  activeGenre: null,
  showTopBtn: false,
};

export default function ClientTimelineView() {
  const { checked: authChecked, user } = useAuth();
  const authed = Boolean(user);
  const [songs, setSongs] = useState<Song[]>([]);
  const [favoriteSongIds, setFavoriteSongIds] = useState<string[]>([]);
  const [categories, setCategories] = useState<UserCategory[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showTopBtn, setShowTopBtn] = useState(false);
  const [detail, setDetail] = useState<Song | null>(null);
  const [homeCategories, setHomeCategories] = useState<HomeCategory[]>([]);
  const [activeParentId, setActiveParentId] = useState<string>("all");
  const [activeChildId, setActiveChildId] = useState<string | null>(null);
  const [activeGenre, setActiveGenre] = useState<string | null>(null);
  const [childSheetOpen, setChildSheetOpen] = useState(false);
  const [childSheetRendered, setChildSheetRendered] = useState(false);
  const [childSheetEntered, setChildSheetEntered] = useState(false);
  const [genreSheetOpen, setGenreSheetOpen] = useState(false);
  const [genreSheetRendered, setGenreSheetRendered] = useState(false);
  const [genreSheetEntered, setGenreSheetEntered] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const genreTabRef = useRef<HTMLButtonElement | null>(null);
  const router = useRouter();
  const initialLoaded = useRef(false);
  const hydratedRef = useRef(false);
  const loadingMoreRef = useRef(false);
  const showTopBtnRef = useRef(false);
  const scrollRafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!activeGenre) return;
    requestAnimationFrame(() => {
      genreTabRef.current?.scrollIntoView({ inline: "nearest", block: "nearest", behavior: "smooth" });
    });
  }, [activeGenre]);

  useEffect(() => {
    if (!timelineViewCache.loaded || !timelineViewCache.hydrated) return;
    setSongs(timelineViewCache.songs);
    setFavoriteSongIds(timelineViewCache.favoriteSongIds);
    setCategories(timelineViewCache.categories);
    setHomeCategories(timelineViewCache.homeCategories);
    setPage(timelineViewCache.page);
    setTotalPages(timelineViewCache.totalPages);
    setActiveParentId(timelineViewCache.activeParentId);
    setActiveChildId(timelineViewCache.activeChildId);
    setActiveGenre(timelineViewCache.activeGenre);
    setShowTopBtn(timelineViewCache.showTopBtn);
    initialLoaded.current = true;
  }, []);

  useEffect(() => {
    return () => {
      timelineViewCache.loaded = true;
      timelineViewCache.hydrated = hydratedRef.current;
      timelineViewCache.songs = songs;
      timelineViewCache.favoriteSongIds = favoriteSongIds;
      timelineViewCache.categories = categories;
      timelineViewCache.homeCategories = homeCategories;
      timelineViewCache.page = page;
      timelineViewCache.totalPages = totalPages;
      timelineViewCache.activeParentId = activeParentId;
      timelineViewCache.activeChildId = activeChildId;
      timelineViewCache.activeGenre = activeGenre;
      timelineViewCache.showTopBtn = showTopBtn;
    };
  }, [songs, favoriteSongIds, categories, homeCategories, page, totalPages, activeParentId, activeChildId, activeGenre, showTopBtn]);

  useEffect(() => {
    showTopBtnRef.current = showTopBtn;
  }, [showTopBtn]);

  const parentTabs = useMemo(
    () => homeCategories.filter((c) => !c.parentId),
    [homeCategories]
  );

  const songCountByCategoryId = useMemo(() => {
    return songs.reduce<Record<string, number>>((acc, song) => {
      (song.categories || []).forEach((sc) => {
        acc[sc.category.id] = (acc[sc.category.id] || 0) + 1;
      });
      return acc;
    }, {});
  }, [songs]);

  const visibleParents = useMemo(
    () =>
      parentTabs.filter((p) =>
        homeCategories.some(
          (c) => c.parentId === p.id && (songCountByCategoryId[c.id] || 0) > 0
        )
      ),
    [parentTabs, homeCategories, songCountByCategoryId]
  );

  const activeChildren = useMemo(() => {
    if (activeParentId === "all") return [];
    return homeCategories.filter(
      (c) => c.parentId === activeParentId && (songCountByCategoryId[c.id] || 0) > 0
    );
  }, [activeParentId, homeCategories, songCountByCategoryId]);

  const genres = useMemo(() => {
    return Array.from(
      new Set(songs.map((s) => (s.genre || "").trim()).filter((g) => g.length > 0))
    ).sort((a, b) => a.localeCompare(b, "zh-Hans-CN"));
  }, [songs]);

  const filteredSongs = useMemo(() => {
    return songs.filter((song) => {
      if (activeChildId) {
        if (!(song.categories || []).some((sc) => sc.category.id === activeChildId)) return false;
      } else if (activeParentId !== "all") {
        if (!(song.categories || []).some((sc) => sc.category.parentId === activeParentId)) return false;
      }
      if (!activeGenre) return true;
      return (song.genre || "").trim() === activeGenre;
    });
  }, [songs, activeChildId, activeParentId, activeGenre]);

  const detailSheetCategories = useMemo(
    () => categories.map((c) => ({ id: c.id, name: c.name, isSystem: c.isSystem })),
    [categories]
  );

  const loadPage = useCallback(async (nextPage: number) => {
    if (loadingMoreRef.current) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    try {
      const d = await fetch(`/api/client/home?page=${nextPage}&pageSize=20`).then((r) => r.json());
      if (!d.success) return;
      hydratedRef.current = true;
      setFavoriteSongIds(Array.isArray(d.data.favoriteSongIds) ? d.data.favoriteSongIds : []);
      setHomeCategories(Array.isArray(d.data.categories) ? d.data.categories : []);
      setPage(d.data.page);
      setTotalPages(d.data.totalPages);
      setSongs((prev) => {
        const merged = nextPage === 1 ? d.data.songs : [...prev, ...d.data.songs];
        const seen = new Set<string>();
        return merged.filter((s: Song) => {
          if (seen.has(s.id)) return false;
          seen.add(s.id);
          return true;
        });
      });
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, []);

  const loadCategories = useCallback(async () => {
    const res = await fetch("/api/client/user-categories");
    if (!res.ok) return;
    const data = await res.json();
    if (data?.success) setCategories(data.data || []);
  }, []);

  useEffect(() => {
    if (!authChecked || initialLoaded.current) return;
    if (authed) {
      initialLoaded.current = true;
      loadCategories();
      loadPage(1);
    }
  }, [authChecked, authed, loadCategories, loadPage]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && page < totalPages && !loadingMoreRef.current) {
          loadPage(page + 1);
        }
      },
      { rootMargin: "900px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [page, totalPages, loadPage]);

  useEffect(() => {
    const onScroll = () => {
      if (scrollRafRef.current != null) return;
      scrollRafRef.current = requestAnimationFrame(() => {
        scrollRafRef.current = null;
        const next = window.scrollY > 500;
        if (next !== showTopBtnRef.current) {
          showTopBtnRef.current = next;
          setShowTopBtn(next);
        }
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (scrollRafRef.current != null) {
        cancelAnimationFrame(scrollRafRef.current);
        scrollRafRef.current = null;
      }
    };
  }, []);

  const openDetail = useCallback((song: Song) => {
    setDetail(song);
  }, []);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    if (childSheetOpen) {
      setChildSheetRendered(true);
      const id = requestAnimationFrame(() => setChildSheetEntered(true));
      return () => cancelAnimationFrame(id);
    }
    setChildSheetEntered(false);
    timer = setTimeout(() => setChildSheetRendered(false), 280);
    return () => { if (timer) clearTimeout(timer); };
  }, [childSheetOpen]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    if (genreSheetOpen) {
      setGenreSheetRendered(true);
      const id = requestAnimationFrame(() => setGenreSheetEntered(true));
      return () => cancelAnimationFrame(id);
    }
    setGenreSheetEntered(false);
    timer = setTimeout(() => setGenreSheetRendered(false), 280);
    return () => { if (timer) clearTimeout(timer); };
  }, [genreSheetOpen]);

  const handleCollect = useCallback(
    async (songId: string, categoryId: string) => {
      if (!authed) {
        router.push(`/client/auth?next=${encodeURIComponent("/client")}`);
        return;
      }
      const res = await fetch("/api/client/user-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryId, songId }),
      });
      if (!res.ok) return;
      const cat = categories.find((c) => c.id === categoryId);
      if (cat?.name === "喜欢") {
        setFavoriteSongIds((prev) => (prev.includes(songId) ? prev : [...prev, songId]));
      }
      await loadCategories();
    },
    [authed, router, categories, loadCategories]
  );

  const handleCreateCategory = useCallback(
    async (name: string) => {
      if (!authed) {
        router.push(`/client/auth?next=${encodeURIComponent("/client")}`);
        return;
      }
      await fetch("/api/client/user-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      await loadCategories();
    },
    [authed, router, loadCategories]
  );

  const handleQuickFavorite = useCallback(
    async (song: Song) => {
      const res = await fetch("/api/client/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ songId: song.id }),
      });
      if (!res.ok) return;
      setFavoriteSongIds((prev) => (prev.includes(song.id) ? prev : [...prev, song.id]));
      await loadCategories();
    },
    [loadCategories]
  );

  const handleQuickUnfavorite = useCallback(
    async (song: Song) => {
      const res = await fetch("/api/client/favorites", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ songId: song.id }),
      });
      if (!res.ok) return;
      setFavoriteSongIds((prev) => prev.filter((id) => id !== song.id));
      await loadCategories();
    },
    [loadCategories]
  );

  useEffect(() => {
    if (authChecked && !authed) router.replace("/");
  }, [authChecked, authed, router]);

  if (!authChecked) {
    return (
      <div className="min-h-[calc(100dvh-5rem)] bg-gradient-to-b from-[#060606] via-[#0b0b0b] to-black p-6 md:p-8">
        <div className="mb-8 h-12 w-64 animate-pulse rounded-xl bg-zinc-800/60" />
        <div className="space-y-4">
          <div className="h-24 animate-pulse rounded-2xl bg-zinc-900/80" />
          <div className="h-24 animate-pulse rounded-2xl bg-zinc-900/80" />
          <div className="h-24 animate-pulse rounded-2xl bg-zinc-900/80" />
        </div>
      </div>
    );
  }

  if (!authed) {
    return null;
  }

  return (
    <div className="min-h-[calc(100dvh-5rem)] bg-gradient-to-b from-[#060606] via-[#0b0b0b] to-black text-zinc-100 p-6 md:p-8">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-fuchsia-600 shadow-lg shadow-red-900/30">
          <svg viewBox="0 0 24 24" className="h-7 w-7 text-white" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="6" cy="12" r="2.2" /><circle cx="18" cy="6" r="2.2" /><circle cx="18" cy="18" r="2.2" />
            <path d="M8 11l7.5-4M8 13l7.5 4" />
          </svg>
        </div>
        <div>
          <p className="text-lg font-semibold tracking-wide">Share Music</p>
          <p className="text-xs text-zinc-400">按发行时间浏览音乐时间线</p>
        </div>
      </div>

      <div className="sticky top-0 z-30 -mx-6 mb-4 bg-[#060606]/92 px-6 py-2 backdrop-blur-lg md:-mx-8 md:px-8">
        <div className="overflow-x-auto whitespace-nowrap" style={{ scrollbarWidth: "none", msOverflowStyle: "none", WebkitOverflowScrolling: "touch" }}>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { setActiveParentId("all"); setActiveChildId(null); setChildSheetOpen(false); }}
              className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition ${activeParentId === "all" ? "bg-zinc-700 text-zinc-100" : "bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800"}`}
            >
              全部
            </button>
            {visibleParents.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setActiveParentId(p.id);
                  setActiveChildId(null);
                  setChildSheetOpen(true);
                }}
                className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition ${activeParentId === p.id ? "bg-zinc-700 text-zinc-100" : "bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800"}`}
              >
                {p.name}
              </button>
            ))}
            <button
              ref={genreTabRef}
              type="button"
              onClick={() => setGenreSheetOpen(true)}
              title={activeGenre ? `${activeGenre}（点击更改流派）` : "按流派筛选"}
              className={`inline-flex min-w-0 max-w-[min(85vw,16rem)] shrink-0 items-center justify-center rounded-full px-3 py-1.5 text-sm font-medium whitespace-nowrap transition ${activeGenre ? "bg-zinc-700 text-zinc-100" : "bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800"}`}
            >
              {activeGenre ? (
                <span className="min-w-0 truncate">{activeGenre}</span>
              ) : (
                <span className="shrink-0">流派</span>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="relative">
        <SongTimelineList
          songs={filteredSongs}
          onOpenDetail={openDetail}
          stickyTopClass="top-12"
          swipeMode="favorite-both"
          onSwipeRight={handleQuickFavorite}
          onSwipeLeft={handleQuickUnfavorite}
          favoriteSongIds={favoriteSongIds}
          unfavoriteVisual="heart-fly"
        />
        <div ref={sentinelRef} className="h-8" />
        {loadingMore ? <div className="pb-4 text-center text-xs text-zinc-500">正在预加载更多...</div> : null}
        {page >= totalPages ? <div className="pb-4 text-center text-xs text-zinc-600">已加载全部</div> : null}
      </div>

      {childSheetRendered ? (
        <div className={`fixed inset-0 z-50 flex items-end bg-black/70 transition-opacity duration-300 ${childSheetEntered ? "opacity-100" : "opacity-0"}`} onClick={() => setChildSheetOpen(false)} role="presentation">
          <div className={`w-full rounded-t-2xl bg-zinc-900 transform-gpu transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${childSheetEntered ? "translate-y-0" : "translate-y-8"}`} onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-center pt-3 pb-2"><div className="h-1 w-10 rounded-full bg-zinc-600" /></div>
            <p className="px-5 pb-2 text-sm font-semibold text-zinc-200">选择二级分类</p>
            <div className="max-h-[50vh] overflow-y-auto px-3 pb-6">
              <button
                type="button"
                onClick={() => { setActiveChildId(null); setChildSheetOpen(false); }}
                className={`mb-1 flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-sm transition ${activeChildId == null ? "bg-zinc-800 text-zinc-100" : "text-zinc-300 hover:bg-zinc-800/70"}`}
              >
                <span>全部</span>
                {activeChildId == null ? <span className="text-xs text-red-400">已选</span> : null}
              </button>
              {activeChildren.length === 0 ? (
                <p className="px-3 py-4 text-sm text-zinc-500">该一级分类下暂无二级分类</p>
              ) : (
                activeChildren.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => { setActiveChildId(c.id); setChildSheetOpen(false); }}
                    className={`mb-1 flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-sm transition ${activeChildId === c.id ? "bg-zinc-800 text-zinc-100" : "text-zinc-300 hover:bg-zinc-800/70"}`}
                  >
                    <span>{c.name}</span>
                    {activeChildId === c.id ? <span className="text-xs text-red-400">已选</span> : null}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      ) : null}

      {genreSheetRendered ? (
        <div className={`fixed inset-0 z-50 flex items-end bg-black/70 transition-opacity duration-300 ${genreSheetEntered ? "opacity-100" : "opacity-0"}`} onClick={() => setGenreSheetOpen(false)} role="presentation">
          <div className={`w-full rounded-t-2xl bg-zinc-900 pb-6 transform-gpu transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${genreSheetEntered ? "translate-y-0" : "translate-y-8"}`} onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-center pt-3 pb-2"><div className="h-1 w-10 rounded-full bg-zinc-600" /></div>
            <p className="px-5 pb-2 text-sm font-semibold text-zinc-200">按流派筛选</p>
            <div className="max-h-[50vh] overflow-y-auto px-3 pb-6">
              <button
                type="button"
                onClick={() => { setActiveGenre(null); setGenreSheetOpen(false); }}
                className={`mb-1 flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-sm transition ${activeGenre == null ? "bg-zinc-800 text-zinc-100" : "text-zinc-300 hover:bg-zinc-800/70"}`}
              >
                <span>全部</span>
                {activeGenre == null ? <span className="text-xs text-red-400">已选</span> : null}
              </button>
              {genres.length === 0 ? (
                <p className="px-3 py-4 text-sm text-zinc-500">暂无可筛选的流派</p>
              ) : (
                genres.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => { setActiveGenre(g); setGenreSheetOpen(false); }}
                    className={`mb-1 flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-sm transition ${activeGenre === g ? "bg-zinc-800 text-zinc-100" : "text-zinc-300 hover:bg-zinc-800/70"}`}
                  >
                    <span>{g}</span>
                    {activeGenre === g ? <span className="text-xs text-red-400">已选</span> : null}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      ) : null}

      <SongDetailSheet
        open={Boolean(detail)}
        loading={false}
        song={detail}
        categories={detailSheetCategories}
        authed={authed}
        onClose={() => { setDetail(null); }}
        onCollect={handleCollect}
        onCreateCategory={handleCreateCategory}
      />

      {showTopBtn ? (
        <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="fixed bottom-24 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full border border-zinc-600 bg-zinc-900/95 text-zinc-100 shadow-lg hover:border-zinc-500" aria-label="回到顶部">
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="M12 19V5M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
      ) : null}
    </div>
  );
}
