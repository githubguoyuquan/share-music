"use client";

import { useEffect, useMemo, useState } from "react";

type Category = {
  id: string;
  name: string;
  color: string | null;
  parentId?: string | null;
  children?: Category[];
  _count?: { songs: number; children?: number };
};

async function readJsonSafe(res: Response) {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

export default function AdminCategoriesPage() {
  const [parents, setParents] = useState<Category[]>([]);
  const [flat, setFlat] = useState<Category[]>([]);
  const [parentName, setParentName] = useState("");
  const [childName, setChildName] = useState("");
  const [activeParent, setActiveParent] = useState<Category | null>(null);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Category | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const [treeRes, flatRes] = await Promise.all([fetch("/api/admin/categories"), fetch("/api/admin/categories?flat=1")]);
    const tree = await readJsonSafe(treeRes);
    const flatData = await readJsonSafe(flatRes);
    if (treeRes.ok && tree.success) setParents(tree.data);
    if (flatRes.ok && flatData.success) setFlat(flatData.data);
    if (!treeRes.ok || !flatRes.ok) showMsg("err", tree.error || flatData.error || "分类加载失败");
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const parentOptions = useMemo(() => flat.filter((c) => !c.parentId), [flat]);
  const visible = useMemo(() => {
    const keyword = q.toLowerCase().trim();
    if (!keyword) return parents;
    return parents
      .map((p) => ({
        ...p,
        children: (p.children || []).filter((c) => c.name.toLowerCase().includes(keyword)),
      }))
      .filter((p) => p.name.toLowerCase().includes(keyword) || (p.children || []).length > 0);
  }, [parents, q]);
  const totalCategories = flat.length;
  const totalSongs = flat.reduce((sum, c) => sum + (c._count?.songs || 0), 0);

  const showMsg = (type: "ok" | "err", text: string) => { setMsg({ type, text }); setTimeout(() => setMsg(null), 3000); };

  const createParent = async () => {
    if (!parentName.trim()) { showMsg("err", "分类名不能为空"); return; }
    const r = await fetch("/api/admin/categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: parentName, color: null, parentId: null }) });
    const d = await readJsonSafe(r);
    if (!r.ok) showMsg("err", d.error || "创建失败");
    else { showMsg("ok", "一级分类已创建"); setParentName(""); load(); }
  };

  const createChild = async () => {
    if (!activeParent) return;
    if (!childName.trim()) { showMsg("err", "二级分类名不能为空"); return; }
    const r = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: childName, color: null, parentId: activeParent.id }),
    });
    const d = await readJsonSafe(r);
    if (!r.ok) showMsg("err", d.error || "创建失败");
    else {
      showMsg("ok", "二级分类已创建");
      setChildName("");
      await load();
      const treeRes = await fetch("/api/admin/categories");
      const tree = await treeRes.json();
      if (tree.success) {
        const latest = (tree.data as Category[]).find((p) => p.id === activeParent.id) || null;
        setActiveParent(latest);
      }
    }
  };

  const updateCategory = async () => {
    if (!editing) return;
    const r = await fetch(`/api/admin/categories/${editing.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: editing.name, color: editing.color, parentId: editing.parentId || null }) });
    const d = await readJsonSafe(r);
    if (!r.ok) showMsg("err", d.error || "更新失败");
    else { setEditing(null); showMsg("ok", "分类已更新"); load(); }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const r = await fetch(`/api/admin/categories/${deleteTarget.id}`, { method: "DELETE" });
    const d = await readJsonSafe(r);
    if (!r.ok) showMsg("err", d.error || "删除失败");
    else { showMsg("ok", "分类已删除"); load(); }
    setDeleteTarget(null);
  };

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
          <p className="mt-1 text-2xl font-bold text-violet-400">{totalCategories}</p>
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
        <h2 className="mb-3 text-sm font-semibold text-zinc-300">新建一级分类</h2>
        <div className="flex flex-wrap gap-3">
          <input value={parentName} onChange={(e) => setParentName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") createParent(); }} placeholder="一级分类名称" className="flex-1 rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-sm outline-none transition focus:border-red-500/50" />
          <button type="button" onClick={createParent} className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-medium transition hover:bg-red-500">新增一级</button>
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
          <div className="space-y-3 p-3">
            {visible.map((p) => (
              <div key={p.id} className="rounded-xl border border-zinc-800/80 bg-zinc-900/70">
                <div className="flex items-center justify-between px-4 py-3">
                  <button type="button" onClick={() => setActiveParent(p)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                    <span className="h-3 w-3 rounded-full ring-2 ring-zinc-800" style={{ background: p.color || "#666" }} />
                    <span className="text-sm font-semibold text-zinc-100">{p.name}</span>
                    <span className="rounded-md bg-zinc-800 px-2 py-0.5 text-[11px] text-zinc-500">{p._count?.songs || 0} 首</span>
                  </button>
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => setEditing({ ...p, parentId: null })} className="rounded-lg px-2 py-1.5 text-xs text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-200">编辑</button>
                    <button type="button" onClick={() => setDeleteTarget(p)} className="rounded-lg px-2 py-1.5 text-xs text-zinc-500 transition hover:bg-red-950/60 hover:text-red-400">删除</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {activeParent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setActiveParent(null)}>
          <div className="w-full max-w-2xl rounded-2xl border border-zinc-700 bg-zinc-900 p-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold">二级分类管理 · {activeParent.name}</h3>
              <button type="button" onClick={() => setActiveParent(null)} className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400 hover:bg-zinc-800">关闭</button>
            </div>
            <div className="mb-3 flex flex-wrap gap-2">
              <input value={childName} onChange={(e) => setChildName(e.target.value)} placeholder="新增二级分类名称" className="flex-1 rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-red-500/50" />
              <button type="button" onClick={createChild} className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium hover:bg-red-500">新增二级</button>
            </div>
            <div className="max-h-[45vh] overflow-y-auto rounded-xl border border-zinc-800/80">
              {(activeParent.children || []).length === 0 ? (
                <p className="p-4 text-sm text-zinc-500">暂无二级分类</p>
              ) : (
                (activeParent.children || []).map((c) => (
                  <div key={c.id} className="flex items-center justify-between border-b border-zinc-800/70 px-4 py-2.5 last:border-b-0">
                    <div className="flex items-center gap-3">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: c.color || "#777" }} />
                      <span className="text-sm text-zinc-200">{c.name}</span>
                      <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[11px] text-zinc-500">{c._count?.songs || 0} 首</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => setEditing({ ...c })} className="rounded px-2 py-1 text-xs text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-200">编辑</button>
                      <button type="button" onClick={() => setDeleteTarget(c)} className="rounded px-2 py-1 text-xs text-zinc-500 transition hover:bg-red-950/60 hover:text-red-400">删除</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

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
              {editing.parentId ? (
                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-500">所属一级分类</label>
                  <select value={editing.parentId || ""} onChange={(e) => setEditing({ ...editing, parentId: e.target.value || null })} className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-sm outline-none focus:border-red-500/50">
                    {parentOptions.filter((p) => p.id !== editing.id).map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              ) : null}
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
