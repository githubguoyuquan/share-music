"use client";

import { useEffect, useMemo, useState } from "react";
import AdminAuthGate from "../_components/AdminAuthGate";

type Category = { id: string; name: string; color: string | null; _count?: { songs: number } };

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [catName, setCatName] = useState("");
  const [catColor, setCatColor] = useState("#ef4444");
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Category | null>(null);
  const [msg, setMsg] = useState("");

  const load = async () => {
    const res = await fetch("/api/admin/categories");
    const data = await res.json();
    if (data.success) setCategories(data.data);
  };

  useEffect(() => { load(); }, []);

  const visible = useMemo(() => categories.filter((c) => c.name.toLowerCase().includes(q.toLowerCase())), [categories, q]);

  const createCategory = async () => {
    const r = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: catName, color: catColor }),
    });
    const d = await r.json();
    if (!r.ok) setMsg(d.error || "创建失败");
    else {
      setMsg("");
      setCatName("");
      load();
    }
  };

  const updateCategory = async () => {
    if (!editing) return;
    const r = await fetch(`/api/admin/categories/${editing.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editing.name, color: editing.color }),
    });
    const d = await r.json();
    if (!r.ok) setMsg(d.error || "更新失败");
    else {
      setEditing(null);
      setMsg("");
      load();
    }
  };

  const removeCategory = async (id: string) => {
    const r = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
    const d = await r.json();
    if (!r.ok) setMsg(d.error || "删除失败");
    else {
      setMsg("");
      load();
    }
  };

  return (
    <AdminAuthGate>
      <div className="grid gap-4 md:grid-cols-3 mb-4">
        <div className="rounded-xl border border-zinc-700 bg-[#212121] p-4"><p className="text-xs text-zinc-400">分类总数</p><p className="text-2xl font-bold">{categories.length}</p></div>
        <div className="rounded-xl border border-zinc-700 bg-[#212121] p-4"><p className="text-xs text-zinc-400">可见分类</p><p className="text-2xl font-bold">{visible.length}</p></div>
        <div className="rounded-xl border border-zinc-700 bg-[#212121] p-4"><p className="text-xs text-zinc-400">状态</p><p className="text-sm mt-1 text-zinc-300">分类 CRUD 就绪</p></div>
      </div>

      <section className="rounded-xl border border-zinc-700 bg-[#212121] p-4">
        <h2 className="text-xl mb-3">分类字段管理（非流派）</h2>
        <div className="mb-3 grid gap-2 md:grid-cols-[1fr_120px_120px]">
          <input value={catName} onChange={(e) => setCatName(e.target.value)} placeholder="分类名称" className="rounded bg-zinc-900 border border-zinc-700 px-3 py-2" />
          <input value={catColor} onChange={(e) => setCatColor(e.target.value)} placeholder="#ef4444" className="rounded bg-zinc-900 border border-zinc-700 px-3 py-2" />
          <button onClick={createCategory} className="rounded bg-red-600 px-3 py-2">新增分类</button>
        </div>

        <div className="mb-3">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="搜索分类" className="w-full rounded bg-zinc-900 border border-zinc-700 px-3 py-2 text-sm" />
        </div>

        {msg ? <p className="mb-2 text-sm text-red-400">{msg}</p> : null}

        <div className="space-y-2">
          {visible.map((c) => (
            <div key={c.id} className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: c.color || "#ef4444" }} />
                <span className="text-sm">{c.name}</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <button onClick={() => setEditing(c)} className="rounded border border-zinc-700 px-2 py-1">编辑</button>
                <button onClick={() => removeCategory(c.id)} className="rounded border border-red-700 px-2 py-1 text-red-300">删除</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {editing ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-xl border border-zinc-700 bg-zinc-900 p-4">
            <h3 className="text-lg font-semibold mb-3">编辑分类</h3>
            <div className="space-y-2">
              <input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className="w-full rounded bg-zinc-950 border border-zinc-700 px-3 py-2" />
              <input value={editing.color || ""} onChange={(e) => setEditing({ ...editing, color: e.target.value })} className="w-full rounded bg-zinc-950 border border-zinc-700 px-3 py-2" />
            </div>
            <div className="mt-3 flex justify-end gap-2">
              <button onClick={() => setEditing(null)} className="rounded border border-zinc-700 px-3 py-1.5">取消</button>
              <button onClick={updateCategory} className="rounded bg-red-600 px-3 py-1.5">保存</button>
            </div>
          </div>
        </div>
      ) : null}
    </AdminAuthGate>
  );
}
