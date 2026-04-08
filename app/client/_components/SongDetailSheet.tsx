"use client";

import { useState } from "react";

type Song = {
  id: string;
  name: string;
  artist: string;
  album: string;
  genre?: string;
  durationSec?: number;
  releaseDate?: string;
  qqMusicUrl?: string | null;
  neteaseUrl?: string | null;
  qishuiUrl?: string | null;
  kuwoUrl?: string | null;
};

type Category = { id: string; name: string; isSystem?: boolean };

type Props = {
  open: boolean;
  loading?: boolean;
  song: Song | null;
  categories: Category[];
  authed: boolean;
  onClose: () => void;
  onCollect: (songId: string, categoryId: string) => Promise<void> | void;
  onCreateCategory: (name: string) => Promise<void> | void;
};

const fmt = (sec?: number) => {
  if (sec == null || Number.isNaN(sec)) return "--:--";
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
};
const fmtDate = (d?: string) => {
  if (!d) return "-";
  try { return new Date(d).toISOString().slice(0, 10); } catch { return "-"; }
};

/* ── Brand logos ── */
function QQMusicIcon({ className }: { className?: string }) {
  return (<svg viewBox="0 0 120 120" className={className} aria-hidden><defs><linearGradient id="qqm" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#3CD880"/><stop offset="100%" stopColor="#31B96A"/></linearGradient></defs><rect rx="26" width="120" height="120" fill="url(#qqm)"/><path d="M52 88V38c0-2.5 1.8-4.7 4.2-5.1l30-5.4c3-.5 5.8 1.7 5.8 4.8V72" fill="none" stroke="#fff" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round"/><circle cx="44" cy="88" r="10" fill="#fff"/><circle cx="84" cy="72" r="10" fill="#fff"/></svg>);
}
function NeteaseIcon({ className }: { className?: string }) {
  return (<svg viewBox="0 0 120 120" className={className} aria-hidden><rect rx="26" width="120" height="120" fill="#E60026"/><circle cx="60" cy="60" r="34" fill="none" stroke="#fff" strokeWidth="6"/><circle cx="60" cy="60" r="14" fill="#fff"/><circle cx="60" cy="60" r="5" fill="#E60026"/><path d="M74 46c4 3 6 8 6 14" fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round"/><path d="M72 34V50" stroke="#fff" strokeWidth="6" strokeLinecap="round"/></svg>);
}
function QishuiIcon({ className }: { className?: string }) {
  return (<svg viewBox="0 0 120 120" className={className} aria-hidden><defs><linearGradient id="qs" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#FF6A3D"/><stop offset="50%" stopColor="#FF3D7F"/><stop offset="100%" stopColor="#C850C0"/></linearGradient></defs><rect rx="26" width="120" height="120" fill="url(#qs)"/><path d="M56 90V42c0-2.5 1.8-4.7 4.2-5.1l24-4.3c3-.5 5.8 1.7 5.8 4.8V74" fill="none" stroke="#fff" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round"/><circle cx="48" cy="90" r="10" fill="#fff"/><circle cx="82" cy="74" r="10" fill="#fff"/><circle cx="36" cy="58" r="5" fill="#fff" opacity=".6"/><circle cx="42" cy="44" r="3.5" fill="#fff" opacity=".4"/></svg>);
}
function KuwoIcon({ className }: { className?: string }) {
  return (<svg viewBox="0 0 120 120" className={className} aria-hidden><defs><linearGradient id="kw" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#4DA3FF"/><stop offset="100%" stopColor="#2D6BFF"/></linearGradient></defs><rect rx="26" width="120" height="120" fill="url(#kw)"/><path d="M42 30v60" stroke="#fff" strokeWidth="8" strokeLinecap="round"/><path d="M44 60L72 36" stroke="#fff" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/><path d="M44 60L72 84" stroke="#fff" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/><circle cx="82" cy="36" r="7" fill="#fff"/><circle cx="82" cy="84" r="7" fill="#fff"/></svg>);
}

function PlayBtn({ label, href, icon }: { label: string; href: string | null | undefined; icon: React.ReactNode }) {
  const inner = (<><span className="flex h-14 w-14 items-center justify-center">{icon}</span><span className="mt-1">{label}</span></>);
  if (!href) return <div className="flex flex-1 flex-col items-center justify-center rounded-xl py-3 text-[11px] font-medium text-zinc-500 opacity-60">{inner}</div>;
  return <a href={href} target="_blank" rel="noopener noreferrer" className="flex flex-1 flex-col items-center justify-center rounded-xl py-3 text-[11px] font-medium text-zinc-200 transition hover:bg-white/5">{inner}</a>;
}

/* ── Bottom menu for category selection ── */
function CollectMenu({
  categories, onPick, onOpenCreate, onClose,
}: {
  categories: Category[];
  onPick: (catId: string) => void;
  onOpenCreate: () => void;
  onClose: () => void;
}) {
  const likeCat = categories.find((c) => c.name === "喜欢");
  const rest = categories.filter((c) => c.name !== "喜欢");
  const sorted = likeCat ? [likeCat, ...rest] : rest;

  return (
    <div className="fixed inset-0 z-[60] flex items-end bg-black/70" onClick={onClose} role="presentation">
      <div className="w-full rounded-t-2xl bg-zinc-900 pb-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-center pt-3 pb-2"><div className="h-1 w-10 rounded-full bg-zinc-600" /></div>
        <p className="px-5 pb-3 text-sm font-semibold text-zinc-300">收藏到分类</p>
        <div className="max-h-[50vh] overflow-y-auto px-3">
          <button type="button" onClick={onOpenCreate} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-zinc-800">
            <span className="flex h-10 w-10 items-center justify-center rounded-full border border-dashed border-zinc-600 text-lg text-zinc-400">＋</span>
            <span className="text-sm font-medium text-zinc-200">新建分类</span>
          </button>
          {sorted.map((cat) => (
            <button key={cat.id} type="button" onClick={() => onPick(cat.id)} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-zinc-800">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800 text-base">
                {cat.name === "喜欢" ? "❤️" : "📁"}
              </span>
              <span className="text-sm text-zinc-100">{cat.name}</span>
            </button>
          ))}
        </div>
        <button type="button" onClick={onClose} className="mt-2 w-full px-5 text-center text-xs text-zinc-500">取消</button>
      </div>
    </div>
  );
}

function CreateCategorySheet({ onSubmit, onClose }: { onSubmit: (name: string) => void; onClose: () => void }) {
  const [name, setName] = useState("");
  return (
    <div className="fixed inset-0 z-[70] flex items-end bg-black/70" onClick={onClose} role="presentation">
      <div className="w-full rounded-t-2xl bg-zinc-900 p-5 pb-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-center pb-3"><div className="h-1 w-10 rounded-full bg-zinc-600" /></div>
        <p className="mb-3 text-sm font-semibold text-zinc-200">新建分类</p>
        <div className="flex gap-2">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="输入分类名称" autoFocus className="flex-1 rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm outline-none focus:border-red-500/50" />
          <button type="button" onClick={() => { if (name.trim()) { onSubmit(name.trim()); } }} className="shrink-0 rounded-xl bg-red-600 px-5 py-3 text-sm font-medium text-white">创建</button>
        </div>
      </div>
    </div>
  );
}

const HERO_PALETTES = [
  { bg: "from-red-600/25 via-fuchsia-600/15 to-zinc-950", blob1: "bg-red-500/20", blob2: "bg-violet-600/15" },
  { bg: "from-blue-600/25 via-cyan-500/15 to-zinc-950", blob1: "bg-blue-500/20", blob2: "bg-cyan-500/15" },
  { bg: "from-emerald-600/25 via-teal-500/15 to-zinc-950", blob1: "bg-emerald-500/20", blob2: "bg-teal-600/15" },
  { bg: "from-amber-600/25 via-orange-500/15 to-zinc-950", blob1: "bg-amber-500/20", blob2: "bg-orange-600/15" },
  { bg: "from-violet-600/25 via-purple-500/15 to-zinc-950", blob1: "bg-violet-500/20", blob2: "bg-purple-600/15" },
  { bg: "from-pink-600/25 via-rose-500/15 to-zinc-950", blob1: "bg-pink-500/20", blob2: "bg-rose-600/15" },
  { bg: "from-sky-600/25 via-indigo-500/15 to-zinc-950", blob1: "bg-sky-500/20", blob2: "bg-indigo-600/15" },
  { bg: "from-lime-600/25 via-green-500/15 to-zinc-950", blob1: "bg-lime-500/20", blob2: "bg-green-600/15" },
  { bg: "from-fuchsia-600/25 via-pink-500/15 to-zinc-950", blob1: "bg-fuchsia-500/20", blob2: "bg-pink-600/15" },
  { bg: "from-cyan-600/25 via-blue-500/15 to-zinc-950", blob1: "bg-cyan-500/20", blob2: "bg-blue-600/15" },
];

function hashIndex(id: string, len: number) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = ((h << 5) - h + id.charCodeAt(i)) | 0;
  return Math.abs(h) % len;
}

/* ── Main sheet ── */
export default function SongDetailSheet(props: Props) {
  const { open, loading, song, categories, authed, onClose, onCollect, onCreateCategory } = props;
  const [collectOpen, setCollectOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  if (!open) return null;

  const palette = song ? HERO_PALETTES[hashIndex(song.id, HERO_PALETTES.length)] : HERO_PALETTES[0];
  const handleClose = () => { setCollectOpen(false); setCreateOpen(false); onClose(); };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 backdrop-blur-[2px]" onClick={handleClose} role="presentation">
        <div className="relative max-h-[88vh] w-full max-w-lg overflow-hidden rounded-t-[1.35rem] border border-zinc-700/80 border-b-0 bg-zinc-950 shadow-[0_-20px_60px_rgba(0,0,0,0.55)]" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
          <div className="flex justify-center pt-3 pb-1"><div className="h-1 w-10 rounded-full bg-zinc-600" aria-hidden /></div>
          <div className="max-h-[calc(88vh-2.5rem)] overflow-y-auto px-5 pb-6 pt-1">
            {loading ? (
              <div className="space-y-4 py-2">
                <div className="h-36 animate-pulse rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-900" />
                <div className="h-8 w-3/4 animate-pulse rounded-lg bg-zinc-800" />
              </div>
            ) : song ? (
              <>
                {/* Hero */}
                <div className={`relative overflow-hidden rounded-2xl border border-zinc-800/80 bg-gradient-to-br ${palette.bg} p-5`}>
                  <div className={`pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full ${palette.blob1} blur-2xl`} />
                  <div className={`pointer-events-none absolute -bottom-10 -left-10 h-36 w-36 rounded-full ${palette.blob2} blur-3xl`} />
                  <div className="relative flex gap-4">
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-black/30 text-3xl shadow-inner">♪</div>
                    <div className="min-w-0 flex-1">
                      <h2 className="text-xl font-bold leading-tight tracking-tight text-white md:text-2xl">{song.name}</h2>
                      <p className="mt-1.5 truncate text-sm text-zinc-300">{song.artist}</p>
                      <p className="mt-0.5 truncate text-xs text-zinc-500">{song.album}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (!authed) return;
                        setCollectOpen(true);
                      }}
                      className="flex h-11 w-11 shrink-0 items-center justify-center self-start rounded-full border border-white/15 bg-black/35 text-lg shadow-md transition hover:border-red-400/50 hover:bg-red-950/40"
                      aria-label="收藏"
                    >
                      ⭐
                    </button>
                  </div>
                </div>

                {/* External play */}
                <div className="mt-4 grid grid-cols-4 gap-1">
                  <PlayBtn label="QQ音乐" href={song.qqMusicUrl} icon={<QQMusicIcon className="h-12 w-12 rounded-2xl" />} />
                  <PlayBtn label="网易云" href={song.neteaseUrl} icon={<NeteaseIcon className="h-12 w-12 rounded-2xl" />} />
                  <PlayBtn label="汽水" href={song.qishuiUrl} icon={<QishuiIcon className="h-12 w-12 rounded-2xl" />} />
                  <PlayBtn label="酷我" href={song.kuwoUrl} icon={<KuwoIcon className="h-12 w-12 rounded-2xl" />} />
                </div>

                {/* Divider */}
                <div className="my-4 flex items-center gap-3">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-zinc-700/60 to-transparent" />
                  <svg className="h-4 w-4 text-zinc-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M9 18V5l10-2v13" strokeLinecap="round" strokeLinejoin="round"/><circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="16" r="2.5"/></svg>
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-zinc-700/60 to-transparent" />
                </div>

                {/* Track info */}
                <ul className="w-full space-y-1">
                  <li className="flex items-center gap-3 py-2.5">
                    <svg className="h-6 w-6 shrink-0 text-zinc-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 18V5l10-2v13" strokeLinecap="round" strokeLinejoin="round"/><circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="16" r="2.5"/></svg>
                    <p className="min-w-0 text-[17px] leading-snug"><span className="text-zinc-500">歌曲：</span><span className="font-semibold text-zinc-100">{song.name}</span></p>
                  </li>
                  <li className="flex items-center gap-3 py-2.5">
                    <svg className="h-6 w-6 shrink-0 text-zinc-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 4-6 8-6s8 2 8 6" strokeLinecap="round"/></svg>
                    <p className="min-w-0 text-[17px] leading-snug text-zinc-200"><span className="text-zinc-500">歌手：</span>{song.artist}</p>
                  </li>
                  <li className="flex items-center gap-3 py-2.5">
                    <svg className="h-6 w-6 shrink-0 text-zinc-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="12" cy="12" r="3"/></svg>
                    <p className="min-w-0 text-[17px] leading-snug text-zinc-200"><span className="text-zinc-500">专辑：</span>{song.album}</p>
                  </li>
                  <li className="flex items-center gap-3 py-2.5">
                    <svg className="h-6 w-6 shrink-0 text-zinc-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><circle cx="7" cy="7" r="1.5" fill="currentColor"/></svg>
                    <p className="min-w-0 text-[17px] leading-snug text-zinc-200"><span className="text-zinc-500">流派：</span>{song.genre || "—"}</p>
                  </li>
                  <li className="flex items-center gap-3 py-2.5">
                    <svg className="h-6 w-6 shrink-0 text-zinc-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    <p className="min-w-0 text-[17px] leading-snug text-zinc-200"><span className="text-zinc-500">时长：</span>{fmt(song.durationSec)}</p>
                  </li>
                  <li className="flex items-center gap-3 py-2.5">
                    <svg className="h-6 w-6 shrink-0 text-zinc-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M8 2v4M16 2v4M3 10h18" strokeLinecap="round"/></svg>
                    <p className="min-w-0 text-[17px] leading-snug tabular-nums text-zinc-200"><span className="text-zinc-500">发行时间：</span>{fmtDate(song.releaseDate)}</p>
                  </li>
                </ul>
                <p className="mt-5 text-center text-[11px] text-zinc-600">点击遮罩关闭</p>
              </>
            ) : null}
          </div>
        </div>
      </div>

      {collectOpen && song ? (
        <CollectMenu
          categories={categories}
          onPick={(catId) => { onCollect(song.id, catId); setCollectOpen(false); }}
          onOpenCreate={() => { setCollectOpen(false); setCreateOpen(true); }}
          onClose={() => setCollectOpen(false)}
        />
      ) : null}

      {createOpen ? (
        <CreateCategorySheet
          onSubmit={(name) => { onCreateCategory(name); setCreateOpen(false); setCollectOpen(true); }}
          onClose={() => { setCreateOpen(false); setCollectOpen(true); }}
        />
      ) : null}
    </>
  );
}
