"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import SongTimelineList from "./_components/SongTimelineList";
import SongDetailSheet from "./_components/SongDetailSheet";

type Song = {
  id: string;
  name: string;
  artist: string;
  album: string;
  genre: string;
  durationSec: number;
  releaseDate: string;
  qqMusicUrl?: string | null;
  neteaseUrl?: string | null;
  qishuiUrl?: string | null;
  kuwoUrl?: string | null;
};
type UserCategory = { id: string; name: string; isSystem: boolean; songs?: { songId?: string; song?: { id: string } }[] };

export default function ClientTimelineView() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [authed, setAuthed] = useState(false);
  const [categories, setCategories] = useState<UserCategory[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showTopBtn, setShowTopBtn] = useState(false);
  const [detail, setDetail] = useState<Song | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();

  const loadPage = async (nextPage: number) => {
    if (loadingMore) return;
    setLoadingMore(true);
    const d = await fetch(`/api/client/home?page=${nextPage}&pageSize=20`).then((r) => r.json());
    setLoadingMore(false);
    if (!d.success) return;
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
  };

  const loadCategories = async () => {
    const res = await fetch("/api/client/user-categories");
    if (!res.ok) return;
    const data = await res.json();
    if (data?.success) setCategories(data.data || []);
  };

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then((d) => {
      const ok = Boolean(d?.success);
      setAuthed(ok);
      if (ok) loadCategories();
    });
    loadPage(1);
  }, []);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && page < totalPages && !loadingMore) loadPage(page + 1);
      },
      { rootMargin: "900px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [page, totalPages, loadingMore]);

  useEffect(() => {
    const onScroll = () => setShowTopBtn(window.scrollY > 500);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const openDetail = async (songId: string) => {
    setDetailLoading(true);
    setDetail(null);
    try {
      const res = await fetch(`/api/client/songs/${songId}`);
      if (!res.ok) { setDetailLoading(false); return; }
      const data = await res.json();
      setDetailLoading(false);
      if (data?.success) setDetail(data.data);
    } catch {
      setDetailLoading(false);
    }
  };

  const handleCollect = async (songId: string, categoryId: string) => {
    if (!authed) { router.push(`/client/auth?next=${encodeURIComponent("/client")}`); return; }
    await fetch("/api/client/user-categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categoryId, songId }),
    });
    await loadCategories();
  };

  const handleCreateCategory = async (name: string) => {
    if (!authed) { router.push(`/client/auth?next=${encodeURIComponent("/client")}`); return; }
    await fetch("/api/client/user-categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    await loadCategories();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#060606] via-[#0b0b0b] to-black text-zinc-100 p-6 md:p-8">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
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
        <div
          onClick={() => router.push(authed ? "/client" : "/client/auth?next=%2Fclient")}
          role="button" tabIndex={0}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") router.push(authed ? "/client" : "/client/auth?next=%2Fclient"); }}
          className={`cursor-pointer rounded-full border px-4 py-2 text-sm transition ${authed ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300" : "border-zinc-700 bg-zinc-900/70 text-zinc-200 hover:border-zinc-500"}`}
        >
          <span className="mr-2 inline-block h-2 w-2 rounded-full bg-current align-middle opacity-90" />
          {authed ? "在线中" : "登录 / 注册"}
        </div>
      </div>

      <div className="relative">
        <SongTimelineList songs={songs} onOpenDetail={(song) => openDetail(song.id)} />
        <div ref={sentinelRef} className="h-8" />
        {loadingMore ? <div className="pb-4 text-center text-xs text-zinc-500">正在预加载更多...</div> : null}
        {page >= totalPages ? <div className="pb-4 text-center text-xs text-zinc-600">已加载全部</div> : null}
      </div>

      <SongDetailSheet
        open={Boolean(detailLoading || detail)}
        loading={detailLoading}
        song={detail}
        categories={categories.map((c) => ({ id: c.id, name: c.name, isSystem: c.isSystem }))}
        authed={authed}
        onClose={() => { setDetail(null); setDetailLoading(false); }}
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
