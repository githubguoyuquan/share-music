"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Me = { id: string; phone: string; role: string; nickname?: string | null };
type CatSong = { id: string; song: { id: string; name: string; artist: string } };
type Cat = { id: string; name: string; isSystem: boolean; songs: CatSong[] };

const GRADIENTS = [
  "from-red-600/70 to-rose-900/80",
  "from-violet-600/70 to-purple-900/80",
  "from-blue-600/70 to-indigo-900/80",
  "from-emerald-600/70 to-teal-900/80",
  "from-amber-600/70 to-orange-900/80",
  "from-pink-600/70 to-fuchsia-900/80",
  "from-cyan-600/70 to-sky-900/80",
  "from-lime-600/70 to-green-900/80",
];

export default function ProfileView() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [cats, setCats] = useState<Cat[]>([]);
  const [selected, setSelected] = useState<Cat | null>(null);
  const [menuCat, setMenuCat] = useState<Cat | null>(null);
  const [renaming, setRenaming] = useState(false);
  const [renameName, setRenameName] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [newCatName, setNewCatName] = useState("");

  const load = async () => {
    const res = await fetch("/api/client/user-categories");
    const data = await res.json();
    if (data.success) setCats(data.data);
  };

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then((d) => {
      if (d.success) setMe(d.data);
    });
    load();
  }, []);

  const handleRename = async () => {
    if (!menuCat || !renameName.trim()) return;
    await fetch(`/api/client/user-categories/${menuCat.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: renameName.trim() }),
    });
    setRenaming(false);
    setMenuCat(null);
    setRenameName("");
    await load();
  };

  const handleDelete = async () => {
    if (!menuCat) return;
    if (!confirm(`确定删除分类「${menuCat.name}」？`)) return;
    await fetch(`/api/client/user-categories/${menuCat.id}`, { method: "DELETE" });
    setMenuCat(null);
    if (selected?.id === menuCat.id) setSelected(null);
    await load();
  };

  const handleCreate = async () => {
    if (!newCatName.trim()) return;
    await fetch("/api/client/user-categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newCatName.trim() }),
    });
    setNewCatName("");
    setCreateOpen(false);
    await load();
  };

  const handleLogout = async () => {
    await fetch("/api/auth/me", { method: "DELETE" });
    router.push("/client/auth");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#060606] to-black p-4 text-zinc-100 md:p-6">
      {/* User info */}
      <div className="mb-6 rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-5">
        {me ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-fuchsia-600 text-xl font-bold text-white shadow-lg">
                {(me.nickname || me.phone)?.[0] || "U"}
              </div>
              <div>
                <p className="text-lg font-semibold">{me.nickname || "音乐用户"}</p>
                <p className="text-xs text-zinc-400">{me.phone}</p>
              </div>
            </div>
            <button type="button" onClick={handleLogout} className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400 transition hover:border-zinc-500 hover:text-zinc-200">退出登录</button>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-sm text-zinc-400 mb-3">请先登录</p>
            <button type="button" onClick={() => router.push("/client/auth?next=/client/profile")} className="rounded-xl bg-red-600 px-6 py-2.5 text-sm font-medium text-white">登录 / 注册</button>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/50 p-3 text-center">
          <p className="text-xl font-bold">{cats.length}</p>
          <p className="text-[11px] text-zinc-500">分类</p>
        </div>
        <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/50 p-3 text-center">
          <p className="text-xl font-bold">{cats.reduce((n, c) => n + (c.songs?.length || 0), 0)}</p>
          <p className="text-[11px] text-zinc-500">收藏</p>
        </div>
        <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/50 p-3 text-center">
          <p className="text-xl font-bold">{cats.find((c) => c.name === "喜欢")?.songs?.length || 0}</p>
          <p className="text-[11px] text-zinc-500">喜欢</p>
        </div>
      </div>

      <h2 className="mb-4 text-lg font-semibold">我的分类</h2>

      {/* Category grid */}
      <div className="grid grid-cols-3 gap-2.5">
        {/* Add category button */}
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="flex aspect-[4/3] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-zinc-700 bg-zinc-900/40 transition hover:border-zinc-500 hover:bg-zinc-800/40 active:scale-[0.97]"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800 text-xl text-zinc-400">＋</span>
          <span className="text-xs font-medium text-zinc-400">添加分类</span>
        </button>
        {cats.map((cat, i) => (
          <div
            key={cat.id}
            role="button"
            tabIndex={0}
            onClick={() => setSelected(cat)}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setSelected(cat); }}
            className="group relative cursor-pointer overflow-hidden rounded-2xl text-left transition active:scale-[0.97]"
          >
            <div className={`aspect-[4/3] bg-gradient-to-br ${GRADIENTS[i % GRADIENTS.length]} p-4 flex flex-col justify-between`}>
              <div className="flex items-start justify-between">
                <span className="text-2xl">{cat.name === "喜欢" ? "❤️" : "📁"}</span>
                {!cat.isSystem ? (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setMenuCat(cat); }}
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-black/30 text-sm text-white/80 opacity-0 transition group-hover:opacity-100"
                    aria-label="更多"
                  >⋯</button>
                ) : null}
              </div>
              <div>
                <p className="text-sm font-bold text-white drop-shadow">{cat.name}</p>
                <p className="text-xs text-white/70">{cat.songs?.length || 0} 首</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Category detail bottom sheet */}
      {selected ? (
        <div className="fixed inset-0 z-50 flex items-end bg-black/70" onClick={() => setSelected(null)} role="presentation">
          <div className="w-full max-h-[75vh] rounded-t-2xl bg-zinc-900 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-center pt-3 pb-1"><div className="h-1 w-10 rounded-full bg-zinc-600" /></div>
            <div className="px-5 pb-2 pt-2 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-zinc-100">{selected.name}</h3>
                <p className="text-xs text-zinc-400 mt-0.5">{selected.songs?.length || 0} 首歌曲</p>
              </div>
              {!selected.isSystem ? (
                <button
                  type="button"
                  onClick={() => { setMenuCat(selected); }}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-700 text-sm text-zinc-300 transition hover:border-zinc-500"
                  aria-label="管理"
                >⋯</button>
              ) : null}
            </div>
            <div className="overflow-y-auto max-h-[55vh] px-4 pb-6">
              {(selected.songs?.length || 0) === 0 ? (
                <p className="py-8 text-center text-sm text-zinc-500">暂无歌曲</p>
              ) : (
                <ul className="divide-y divide-zinc-800/50">
                  {selected.songs.map((row) => (
                    <li key={row.id} className="flex items-center gap-3 py-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-800 text-base">♪</div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-zinc-100">{row.song.name}</p>
                        <p className="truncate text-xs text-zinc-400">{row.song.artist}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {/* Three-dot menu sheet */}
      {menuCat ? (
        <div className="fixed inset-0 z-[60] flex items-end bg-black/70" onClick={() => { setMenuCat(null); setRenaming(false); }} role="presentation">
          <div className="w-full rounded-t-2xl bg-zinc-900 pb-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-center pt-3 pb-2"><div className="h-1 w-10 rounded-full bg-zinc-600" /></div>
            <p className="px-5 pb-3 text-sm font-semibold text-zinc-300">管理「{menuCat.name}」</p>

            {renaming ? (
              <div className="px-5 flex gap-2">
                <input
                  value={renameName}
                  onChange={(e) => setRenameName(e.target.value)}
                  placeholder="输入新名称"
                  autoFocus
                  className="flex-1 rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm outline-none focus:border-red-500/50"
                />
                <button type="button" onClick={handleRename} className="shrink-0 rounded-xl bg-red-600 px-5 py-3 text-sm font-medium text-white">确定</button>
              </div>
            ) : (
              <div className="px-3">
                <button type="button" onClick={() => { setRenameName(menuCat.name); setRenaming(true); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-3.5 text-left text-sm text-zinc-100 transition hover:bg-zinc-800">
                  <svg className="h-5 w-5 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 20h9M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4z" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  重命名
                </button>
                <button type="button" onClick={handleDelete} className="flex w-full items-center gap-3 rounded-xl px-3 py-3.5 text-left text-sm text-red-400 transition hover:bg-zinc-800">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  删除分类
                </button>
              </div>
            )}

            <button type="button" onClick={() => { setMenuCat(null); setRenaming(false); }} className="mt-2 w-full text-center text-xs text-zinc-500">取消</button>
          </div>
        </div>
      ) : null}

      {/* Create category sheet */}
      {createOpen ? (
        <div className="fixed inset-0 z-[60] flex items-end bg-black/70" onClick={() => { setCreateOpen(false); setNewCatName(""); }} role="presentation">
          <div className="w-full rounded-t-2xl bg-zinc-900 p-5 pb-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-center pb-3"><div className="h-1 w-10 rounded-full bg-zinc-600" /></div>
            <p className="mb-3 text-sm font-semibold text-zinc-200">新建分类</p>
            <div className="flex gap-2">
              <input
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="输入分类名称"
                autoFocus
                onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); }}
                className="flex-1 rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm outline-none focus:border-red-500/50"
              />
              <button type="button" onClick={handleCreate} className="shrink-0 rounded-xl bg-red-600 px-5 py-3 text-sm font-medium text-white">创建</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
