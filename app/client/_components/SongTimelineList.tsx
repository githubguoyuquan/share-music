"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Song = {
  id: string;
  name: string;
  artist: string;
  album: string;
  coverUrl?: string | null;
  genre?: string;
  durationSec?: number;
  releaseDate?: string;
};

type Props = {
  songs: Song[];
  onOpenDetail: (song: Song) => void;
  actions?: (song: Song) => React.ReactNode;
  emptyText?: string;
  stickyTopClass?: string;
  swipeMode?: "none" | "favorite-right" | "unfavorite-left" | "favorite-both";
  onSwipeRight?: (song: Song) => Promise<void> | void;
  onSwipeLeft?: (song: Song) => Promise<void> | void;
  favoriteSongIds?: string[];
  unfavoriteVisual?: "slide-out" | "heart-fly";
  showFavoriteBackground?: boolean;
};

const monthKeyFromReleaseDate = (releaseDate?: string) => {
  if (!releaseDate) return "未知时间";
  const d = new Date(releaseDate);
  if (Number.isNaN(d.getTime())) return "未知时间";
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
};

const compareMonthKeyDesc = (a: string, b: string) => {
  if (a === b) return 0;
  if (a === "未知时间") return 1;
  if (b === "未知时间") return -1;
  return a < b ? 1 : -1;
};

const displayMonth = (key: string) => {
  if (key === "未知时间") return "未知";
  const [y, m] = key.split("-");
  return `${parseInt(m, 10)}月 ${y} 发行`;
};

export default function SongTimelineList({
  songs,
  onOpenDetail,
  actions,
  emptyText = "暂无歌曲",
  stickyTopClass = "top-0",
  swipeMode = "none",
  onSwipeRight,
  onSwipeLeft,
  favoriteSongIds = [],
  unfavoriteVisual = "slide-out",
  showFavoriteBackground = true,
}: Props) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [dragX, setDragX] = useState<Record<string, number>>({});
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [heartBurst, setHeartBurst] = useState<{ id: string; kind: "favorite" | "unfavorite" } | null>(null);
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());
  const startRef = useRef<{ id: string; x: number; y: number } | null>(null);
  const horizontalRef = useRef(false);
  const blockClickRef = useRef<string | null>(null);
  const draggingIdRef = useRef<string | null>(null);
  const dragRafRef = useRef<number | null>(null);
  const pendingDragRef = useRef<{ id: string; dx: number } | null>(null);

  useEffect(() => {
    draggingIdRef.current = draggingId;
  }, [draggingId]);

  const scheduleDragUpdate = useCallback((id: string, dx: number) => {
    pendingDragRef.current = { id, dx };
    if (dragRafRef.current != null) return;
    dragRafRef.current = requestAnimationFrame(() => {
      dragRafRef.current = null;
      const p = pendingDragRef.current;
      if (!p) return;
      setDragX((prev) => {
        if (prev[p.id] === p.dx) return prev;
        return { ...prev, [p.id]: p.dx };
      });
    });
  }, []);

  useEffect(() => {
    return () => {
      if (dragRafRef.current != null) cancelAnimationFrame(dragRafRef.current);
    };
  }, []);

  // Defensive cleanup: some mobile browsers occasionally miss per-card touchend/cancel.
  // If a touch terminates elsewhere, the card could stay offset ("stuck").
  useEffect(() => {
    if (swipeMode === "none") return;
    const cleanup = () => {
      const id = draggingIdRef.current;
      if (!id) return;
      setDragX((p) => ({ ...p, [id]: 0 }));
      startRef.current = null;
      horizontalRef.current = false;
      setDraggingId(null);
    };
    window.addEventListener("touchend", cleanup, { passive: true });
    window.addEventListener("touchcancel", cleanup, { passive: true });
    return () => {
      window.removeEventListener("touchend", cleanup);
      window.removeEventListener("touchcancel", cleanup);
    };
  }, [swipeMode]);

  const favoriteSet = useMemo(() => new Set(favoriteSongIds), [favoriteSongIds]);

  const { groupedByMonth, monthKeys } = useMemo(() => {
    const grouped = songs.reduce<Record<string, Song[]>>((acc, song) => {
      const key = monthKeyFromReleaseDate(song.releaseDate);
      if (!acc[key]) acc[key] = [];
      acc[key].push(song);
      return acc;
    }, {});
    const keys = Object.keys(grouped).sort(compareMonthKeyDesc);
    return { groupedByMonth: grouped, monthKeys: keys };
  }, [songs]);

  if (!monthKeys.length) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-zinc-800/60 bg-zinc-900/40 px-6 py-12 text-center">
        <svg className="h-10 w-10 text-zinc-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 18V5l10-2v13" strokeLinecap="round" strokeLinejoin="round" /><circle cx="6" cy="18" r="2.5" /><circle cx="18" cy="16" r="2.5" /></svg>
        <p className="text-sm text-zinc-500">{emptyText}</p>
      </div>
    );
  }

  /* Sticky rail + month headers: long lists keep the timeline visible while scrolling. */
  const railHeightClass = "h-[calc(100dvh-8.5rem)]";

  return (
    <section ref={sectionRef} className="relative flex gap-0">
      {/* Viewport-height sticky guide rail — stays on screen as the list scrolls */}
      <div
        className={`sticky ${stickyTopClass} z-[1] ${railHeightClass} w-3 shrink-0 self-start pointer-events-none pt-1`}
        aria-hidden
      >
        <div className="mx-auto h-full w-[2px] rounded-full bg-gradient-to-b from-red-500/75 via-red-600/35 to-zinc-800/25 shadow-[0_0_12px_rgba(239,68,68,0.12)]" />
      </div>

      <div className="min-w-0 flex-1 pl-2 pr-0">
      {monthKeys.map((monthKey) => (
        <div key={monthKey} className="relative pb-4">
          {/* Month node — sticky label + dot aligned to the rail */}
          <div
            className={`sticky ${stickyTopClass} z-[8] -mx-1 mb-2 flex items-center gap-2 rounded-xl border border-zinc-800/40 bg-zinc-950/90 py-2 pl-2 pr-3 shadow-[0_8px_24px_rgba(0,0,0,0.35)] backdrop-blur-md supports-[backdrop-filter]:bg-zinc-950/75`}
          >
            <div className="relative flex h-3 w-3 shrink-0 -translate-x-3 items-center justify-center">
              <span className="absolute inset-0 rounded-full bg-red-500/25 blur-[3px]" />
              <div className="relative h-3 w-3 rounded-full border-2 border-red-500 bg-zinc-950 shadow-[0_0_0_1px_rgba(0,0,0,0.4)]" />
            </div>
            <span className="text-xs font-semibold tracking-wide text-red-400/95">{displayMonth(monthKey)}</span>
          </div>

          {/* Song cards */}
          <div className="space-y-0">
            {groupedByMonth[monthKey].map((song) => {
              const isFavorited = favoriteSet.has(song.id);
              const dx = dragX[song.id] || 0;
              const isDraggingRow = draggingId === song.id;
              const favorBg =
                showFavoriteBackground && isFavorited
                  ? "linear-gradient(90deg, rgba(239,68,68,0) 82%, rgba(239,68,68,0.22) 100%)"
                  : undefined;
              return (
                <div
                  key={song.id}
                  className={`group relative cursor-pointer overflow-hidden rounded-xl transition-all duration-300 ${
                    removingIds.has(song.id) ? "-translate-x-[110%] opacity-0 scale-[0.98] max-h-0 py-0 border-transparent" : "max-h-56"
                  } ${isDraggingRow ? "will-change-transform" : ""}`}
                  style={{
                    transform: removingIds.has(song.id)
                      ? undefined
                      : `translate3d(${dx}px,0,0)`,
                    background: removingIds.has(song.id) ? undefined : favorBg,
                    transition: isDraggingRow ? "none" : undefined,
                  }}
                  onClick={() => {
                    if (blockClickRef.current === song.id) return;
                    onOpenDetail(song);
                  }}
                  onTouchStart={(e) => {
                    if (swipeMode === "none") return;
                    const t = e.touches[0];
                    startRef.current = { id: song.id, x: t.clientX, y: t.clientY };
                    horizontalRef.current = false;
                    setDraggingId(song.id);
                  }}
                  onTouchMove={(e) => {
                    if (!startRef.current || startRef.current.id !== song.id || swipeMode === "none") return;
                    const t = e.touches[0];
                    const dxMove = t.clientX - startRef.current.x;
                    const dy = t.clientY - startRef.current.y;
                    if (!horizontalRef.current) {
                      if (Math.abs(dxMove) > 10 && Math.abs(dxMove) > Math.abs(dy)) horizontalRef.current = true;
                      else return;
                    }
                    const canRightByMode = swipeMode === "favorite-right" || swipeMode === "favorite-both";
                    const canLeftByMode = swipeMode === "unfavorite-left" || swipeMode === "favorite-both";
                    // State-driven swipe: not-favorited only right, favorited only left.
                    const allowRight = canRightByMode && !isFavorited && dxMove > 0;
                    const allowLeft = canLeftByMode && isFavorited && dxMove < 0;
                    if (!allowRight && !allowLeft) return;
                    // Follow finger — batched to one setState per animation frame to cut down repaints.
                    scheduleDragUpdate(song.id, dxMove);
                  }}
                  onTouchEnd={async () => {
                    if (swipeMode === "none") return;
                    if (!startRef.current || startRef.current.id !== song.id) {
                      if (draggingId === song.id) {
                        setDragX((p) => ({ ...p, [song.id]: 0 }));
                        setDraggingId(null);
                      }
                      return;
                    }
                    if (dragRafRef.current != null) {
                      cancelAnimationFrame(dragRafRef.current);
                      dragRafRef.current = null;
                    }
                    const pend = pendingDragRef.current;
                    const dxEnd =
                      pend?.id === song.id ? pend.dx : (dragX[song.id] || 0);
                    const passRight = (swipeMode === "favorite-right" || swipeMode === "favorite-both") && !isFavorited && dxEnd > 90;
                    const passLeft = (swipeMode === "unfavorite-left" || swipeMode === "favorite-both") && isFavorited && dxEnd < -90;
                    if (passRight) {
                      blockClickRef.current = song.id;
                      setHeartBurst({ id: song.id, kind: "favorite" });
                      setTimeout(() => setHeartBurst((x) => (x?.id === song.id ? null : x)), 760);
                      if (onSwipeRight) await onSwipeRight(song);
                      setTimeout(() => { blockClickRef.current = null; }, 220);
                    } else if (passLeft) {
                      blockClickRef.current = song.id;
                      if (unfavoriteVisual === "slide-out") {
                        setRemovingIds((p) => new Set([...p, song.id]));
                        setTimeout(async () => {
                          if (onSwipeLeft) await onSwipeLeft(song);
                          setRemovingIds((p) => {
                            const n = new Set(p);
                            n.delete(song.id);
                            return n;
                          });
                          blockClickRef.current = null;
                        }, 340);
                      } else {
                        setHeartBurst({ id: song.id, kind: "unfavorite" });
                        setTimeout(() => setHeartBurst((x) => (x?.id === song.id ? null : x)), 760);
                        if (onSwipeLeft) await onSwipeLeft(song);
                        setTimeout(() => { blockClickRef.current = null; }, 220);
                      }
                    }
                    setDragX((p) => ({ ...p, [song.id]: 0 }));
                    startRef.current = null;
                    setDraggingId(null);
                  }}
                  onTouchCancel={() => {
                    setDragX((p) => ({ ...p, [song.id]: 0 }));
                    startRef.current = null;
                    setDraggingId(null);
                  }}
                >
                  <div className="flex items-center gap-2.5 px-2 py-2">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden bg-zinc-800/60 text-zinc-500">
                      {song.coverUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={song.coverUrl}
                          alt={`${song.name} cover`}
                          className="h-full w-full object-cover"
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M9 18V5l10-2v13" strokeLinecap="round" strokeLinejoin="round" /><circle cx="6" cy="18" r="2.5" /><circle cx="18" cy="16" r="2.5" /></svg>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-lg font-medium text-zinc-100 group-hover:text-white">{song.name}</p>
                      <p className="mt-0.5 truncate text-base text-zinc-400">{song.artist}{song.album ? <span className="mx-1 text-zinc-600">·</span> : null}{song.album || ""}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {actions ? <div>{actions(song)}</div> : (
                        <svg className="h-4.5 w-4.5 text-zinc-600 transition group-hover:text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      )}
                    </div>
                  </div>
                  {heartBurst?.id === song.id ? (
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                      <div
                        className={`text-[76px] leading-none text-red-500 drop-shadow-[0_0_24px_rgba(239,68,68,0.55)] ${
                          heartBurst.kind === "favorite"
                            ? "animate-[heart-fly-right_720ms_ease-out_forwards]"
                            : "animate-[heart-fly-left_720ms_ease-out_forwards]"
                        }`}
                      >
                        ❤
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      ))}
      </div>
    </section>
  );
}
