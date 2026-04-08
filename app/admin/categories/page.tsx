"use client";

import { useEffect, useMemo, useState } from "react";

type Category = { id: string; name: string; color: string | null; _count?: { songs: number } };

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [catName, setCatName] = useState("");
  const [catColor, setCatColor] = useState("#ef4444");
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Category | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const res = await fetch("/api/admin/categories");
    const data = await res.json();
    if (data.success) setCategories(data.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const visible = useMemo(() => categories.filter((c) => c.name.toLowerCase().includes(q.toLowerCase())), [categories, q]);
  const totalSongs = categories.reduce((sum, c) => sum + (c._count?.songs || 0), 0);

  const showMsg = (type: "ok" | "err", text: string) => { setMsg({ type, text }); setTimeout(() => setMsg(null), 3000); };

  const createCategory = async () => {
    if (!catName.trim()) { showMsg("err", "分类名不能为空"); return; }
    const r = await fetch("/api/admin/categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: catName, color: catColor }) });
    const d = await r.json();
    if (!r.ok) showMsg("err", d.error || "创建失败");
    else { showMsg("ok", "分类已创建"); setCatName(""); load(); }
  };

  const updateCategory = async () => {
    if (!editing) return;
    const r = await fetch(`/api/admin/categories/${editing.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: editing.name, color: editing.color }) });
    const d = await r.json();
    if (!r.ok) showMsg("err", d.error || "更新失败");
    else { setEditing(null); showMsg("ok", "分类已更新"); load(); }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const r = await fetch(`/api/admin/categories/${deleteTarget.id}`, { method: "DELETE" });
    const d = await r.json();
    if (!r.ok) showMsg("err", d.error || "删除失败");
    else { showMsg("ok", "分类已删除"); load(); }
    setDeleteTarget(null);
  };

  const PRESET_COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899"];

  return (
    <div>
      {/* Toast */}
      {msg && (
        <div className={`fixed right-4 top-4 z-[100] rounded-xl border px-5 py-3 text-sm shadow-xl ${msg.type === "ok" ? "border-emerald-700 bg-emerald-950/90 text-emerald-300" : "border-red-700 bg-red-950/90 text-red-300"}`}>
          {msg.text}
        </div>
      )}

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">分类管理</h1>
          <p className="text-sm text-zinc-500">管理歌曲分类字段（非流派）</p>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
          <p className="text-xs text-zinc-500">分类总数</p>
          <p className="mt-1 text-2xl font-bold text-violet-400">{categories.length}</p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
          <p className="text-xs text-zinc-500">歌曲关联总数</p>
          <p className="mt-1 text-2xl font-bold text-red-400">{totalSongs}</p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
          <p className="text-xs text-zinc-500">搜索结果</p>
          <p className="mt-1 text-2xl font-bold text-zinc-300">{q ? visible.length : "—"}</p>
        </div>
      </div>

      {/* Create */}
      <div className="mb-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
        <h2 className="mb-3 text-sm font-semibold text-zinc-300">新建分类</h2>
        <div className="flex flex-wrap gap-3">
          <input value={catName} onChange={(e) => setCatName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") createCategory(); }} placeholder="分类名称" className="flex-1 rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-sm outline-none transition focus:border-red-500/50" />
          <div className="flex items-center gap-2">
            {PRESET_COLORS.map((c) => (
              <button key={c} type="button" onClick={() => setCatColor(c)} className={`h-7 w-7 rounded-full transition ${catColor === c ? "ring-2 ring-white ring-offset-2 ring-offset-zinc-900" : "ring-1 ring-zinc-700 hover:ring-zinc-500"}`} style={{ background: c }} />
            ))}
          </div>
          <button type="button" onClick={createCategory} className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-medium transition hover:bg-red-500">新增</button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="搜索分类..." className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm outline-none transition focus:border-red-500/50" />
      </div>

      {/* List */}
      <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/50">
        {loading ? (
          <div className="space-y-2 p-4">{[1,2,3].map((i) => <div key={i} className="h-12 animate-pulse rounded-xl bg-zinc-800/60" />)}</div>
        ) : visible.length === 0 ? (
          <p className="p-6 text-center text-sm text-zinc-600">{q ? "未找到匹配分类" : "暂无分类"}</p>
        ) : (
          <div className="divide-y divide-zinc-800/50">
            {visible.map((c) => (
              <div key={c.id} className="flex items-center justify-between px-5 py-3.5 transition hover:bg-zinc-800/30">
                <div className="flex items-center gap-3">
                  <span className="h-3 w-3 rounded-full ring-2 ring-zinc-800" style={{ background: c.color || "#666" }} />
                  <span className="text-sm font-medium text-zinc-200">{c.name}</span>
                  <span className="rounded-md bg-zinc-800 px-2 py-0.5 text-[11px] text-zinc-500">{c._count?.songs || 0} 首</span>
                </div>
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => setEditing({ ...c })} className="rounded-lg px-2.5 py-1.5 text-xs text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-200">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" strokeLinecap="round" strokeLinejoin="round"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                  <button type="button" onClick={() => setDeleteTarget(c)} className="rounded-lg px-2.5 py-1.5 text-xs text-zinc-500 transition hover:bg-red-950/60 hover:text-red-400">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setEditing(null)}>
          <div className="w-full max-w-md rounded-2xl border border-zinc-700 bg-zinc-900 p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-4 text-lg font-bold">编辑分类</h3>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-500">分类名</label>
                <input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-sm outline-none focus:border-red-500/50" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-500">颜色</label>
                <div className="flex items-center gap-2">
                  {PRESET_COLORS.map((c) => (
                    <button key={c} type="button" onClick={() => setEditing({ ...editing, color: c })} className={`h-7 w-7 rounded-full transition ${editing.color === c ? "ring-2 ring-white ring-offset-2 ring-offset-zinc-900" : "ring-1 ring-zinc-700"}`} style={{ background: c }} />
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-5 flex items-center justify-end gap-3">
              <button type="button" onClick={() => setEditing(null)} className="rounded-xl border border-zinc-700 px-5 py-2.5 text-sm transition hover:bg-zinc-800">取消</button>
              <button type="button" onClick={updateCategory} className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-medium transition hover:bg-red-500">保存</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setDeleteTarget(null)}>
          <div className="w-full max-w-sm rounded-2xl border border-zinc-700 bg-zinc-900 p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold">确认删除</h3>
            <p className="mt-2 text-sm text-zinc-400">
              确定要删除分类 <span className="font-medium text-zinc-200">&ldquo;{deleteTarget.name}&rdquo;</span> 吗？
              {(deleteTarget._count?.songs || 0) > 0 && <span className="mt-1 block text-red-400">该分类下有 {deleteTarget._count?.songs} 首关联歌曲，删除前需先解除关联。</span>}
            </p>
            <div className="mt-5 flex items-center justify-end gap-3">
              <button type="button" onClick={() => setDeleteTarget(null)} className="rounded-xl border border-zinc-700 px-5 py-2.5 text-sm transition hover:bg-zinc-800">取消</button>
              <button type="button" onClick={confirmDelete} className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-medium transition hover:bg-red-500">确认删除</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
