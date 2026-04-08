"use client";

import { useEffect, useState, useCallback } from "react";

type Category = { id: string; name: string; color: string | null };
type Song = {
  id: string; name: string; artist: string; album: string;
  durationSec: number; releaseDate: string; genre: string;
  coverUrl: string | null; qqMusicUrl: string | null; neteaseUrl: string | null;
  qishuiUrl: string | null; kuwoUrl: string | null;
  categories?: { category: Category }[];
};

const EMPTY_FORM = {
  name: "", artist: "", album: "", durationSec: 180, releaseDate: "2024-01-01",
  genre: "流行", coverUrl: "", qqMusicUrl: "", neteaseUrl: "", qishuiUrl: "", kuwoUrl: "",
  categoryIds: [] as string[],
};

function fmtDate(iso: string) {
  const d = new Date(iso);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

function fmtDuration(sec: number) {
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
}

export default function AdminSongsPage() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formLoading, setFormLoading] = useState(false);
  const [formMsg, setFormMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<Song | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  const loadSongs = useCallback(async (p = page, search = q) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/songs?page=${p}&pageSize=20&q=${encodeURIComponent(search)}`);
      const data = await res.json();
      if (data.success) {
        setSongs(data.data.items);
        setPage(data.data.page);
        setTotalPages(data.data.totalPages || 1);
        setTotal(data.data.total);
      }
    } finally { setLoading(false); }
  }, [page, q]);

  const loadCategories = async () => {
    const res = await fetch("/api/admin/categories");
    const data = await res.json();
    if (data.success) setAllCategories(data.data);
  };

  useEffect(() => { loadSongs(1, ""); loadCategories(); }, []);

  const doSearch = () => { setQ(searchInput); loadSongs(1, searchInput); };

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormMsg(null);
    setShowForm(true);
  };

  const openEdit = (s: Song) => {
    setEditingId(s.id);
    setForm({
      name: s.name, artist: s.artist, album: s.album, durationSec: s.durationSec,
      releaseDate: fmtDate(s.releaseDate), genre: s.genre,
      coverUrl: s.coverUrl || "", qqMusicUrl: s.qqMusicUrl || "",
      neteaseUrl: s.neteaseUrl || "", qishuiUrl: s.qishuiUrl || "", kuwoUrl: s.kuwoUrl || "",
      categoryIds: s.categories?.map((c) => c.category.id) || [],
    });
    setFormMsg(null);
    setShowForm(true);
  };

  const submitForm = async () => {
    if (!form.name.trim() || !form.artist.trim()) { setFormMsg({ type: "err", text: "歌曲名和歌手为必填" }); return; }
    setFormLoading(true);
    setFormMsg(null);
    try {
      const url = editingId ? `/api/admin/songs/${editingId}` : "/api/admin/songs";
      const method = editingId ? "PUT" : "POST";
      const body = { ...form, durationSec: Number(form.durationSec), coverUrl: form.coverUrl || null, qqMusicUrl: form.qqMusicUrl || null, neteaseUrl: form.neteaseUrl || null, qishuiUrl: form.qishuiUrl || null, kuwoUrl: form.kuwoUrl || null };
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok || !data.success) { setFormMsg({ type: "err", text: data.error || "操作失败" }); return; }
      setShowForm(false);
      showToast(editingId ? "歌曲已更新" : "歌曲已创建");
      loadSongs(editingId ? page : 1, q);
    } catch { setFormMsg({ type: "err", text: "网络错误" }); } finally { setFormLoading(false); }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/admin/songs/${deleteTarget.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data.success) { showToast(data.error || "删除失败"); return; }
      setDeleteTarget(null);
      showToast("歌曲已删除");
      loadSongs(page, q);
    } catch { showToast("网络错误"); } finally { setDeleteLoading(false); }
  };

  const toggleCategory = (catId: string) => {
    setForm((f) => ({
      ...f,
      categoryIds: f.categoryIds.includes(catId) ? f.categoryIds.filter((x) => x !== catId) : [...f.categoryIds, catId],
    }));
  };

  const setField = (key: string, value: string | number) => setForm((f) => ({ ...f, [key]: value }));

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div className="fixed right-4 top-4 z-[100] animate-[fadeIn_0.2s] rounded-xl border border-zinc-700 bg-zinc-900 px-5 py-3 text-sm text-zinc-200 shadow-xl">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">歌曲管理</h1>
          <p className="text-sm text-zinc-500">共 {total} 首，按发行时间倒序</p>
        </div>
        <button type="button" onClick={openCreate} className="flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-medium transition hover:bg-red-500">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" strokeLinecap="round"/></svg>
          添加歌曲
        </button>
      </div>

      {/* Search */}
      <div className="mb-4 flex gap-2">
        <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") doSearch(); }} placeholder="搜索歌曲名、歌手、专辑..." className="flex-1 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm outline-none transition focus:border-red-500/50" />
        <button type="button" onClick={doSearch} className="rounded-xl border border-zinc-700 bg-zinc-800 px-5 py-2.5 text-sm transition hover:bg-zinc-700">搜索</button>
        {q && <button type="button" onClick={() => { setSearchInput(""); setQ(""); loadSongs(1, ""); }} className="rounded-xl border border-zinc-700 px-4 py-2.5 text-sm text-zinc-400 transition hover:text-zinc-200">清除</button>}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/50">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-xs text-zinc-500">
                <th className="px-4 py-3 text-left font-medium">歌曲</th>
                <th className="px-4 py-3 text-left font-medium">歌手</th>
                <th className="hidden px-4 py-3 text-left font-medium md:table-cell">专辑</th>
                <th className="hidden px-4 py-3 text-left font-medium sm:table-cell">时长</th>
                <th className="hidden px-4 py-3 text-left font-medium lg:table-cell">发行时间</th>
                <th className="hidden px-4 py-3 text-left font-medium lg:table-cell">流派</th>
                <th className="hidden px-4 py-3 text-left font-medium xl:table-cell">分类</th>
                <th className="px-4 py-3 text-right font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {loading && songs.length === 0 ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-zinc-800/50">
                    <td colSpan={8} className="px-4 py-3"><div className="h-5 w-full animate-pulse rounded bg-zinc-800" /></td>
                  </tr>
                ))
              ) : songs.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-zinc-600">{q ? "未找到匹配歌曲" : "暂无歌曲"}</td></tr>
              ) : songs.map((s) => (
                <tr key={s.id} className="border-b border-zinc-800/50 transition hover:bg-zinc-800/30">
                  <td className="px-4 py-3 font-medium text-zinc-200">{s.name}</td>
                  <td className="px-4 py-3 text-zinc-400">{s.artist}</td>
                  <td className="hidden px-4 py-3 text-zinc-400 md:table-cell">{s.album}</td>
                  <td className="hidden px-4 py-3 text-zinc-500 sm:table-cell">{fmtDuration(s.durationSec)}</td>
                  <td className="hidden px-4 py-3 text-zinc-500 lg:table-cell">{fmtDate(s.releaseDate)}</td>
                  <td className="hidden px-4 py-3 lg:table-cell"><span className="rounded-md bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">{s.genre}</span></td>
                  <td className="hidden px-4 py-3 xl:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {s.categories?.map((c) => (
                        <span key={c.category.id} className="rounded-md px-1.5 py-0.5 text-[11px]" style={{ background: (c.category.color || "#444") + "30", color: c.category.color || "#aaa" }}>
                          {c.category.name}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button type="button" onClick={() => openEdit(s)} className="rounded-lg px-2.5 py-1.5 text-xs text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-200" title="编辑">
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" strokeLinecap="round" strokeLinejoin="round"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </button>
                      <button type="button" onClick={() => setDeleteTarget(s)} className="rounded-lg px-2.5 py-1.5 text-xs text-zinc-500 transition hover:bg-red-950/60 hover:text-red-400" title="删除">
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-zinc-800 px-4 py-3 text-sm">
          <span className="text-zinc-500">第 {page} / {totalPages} 页</span>
          <div className="flex gap-2">
            <button type="button" disabled={page <= 1} onClick={() => loadSongs(page - 1, q)} className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs transition hover:bg-zinc-800 disabled:opacity-30">上一页</button>
            <button type="button" disabled={page >= totalPages} onClick={() => loadSongs(page + 1, q)} className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs transition hover:bg-zinc-800 disabled:opacity-30">下一页</button>
          </div>
        </div>
      </div>

      {/* Create / Edit modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 pt-[10vh]" onClick={() => setShowForm(false)}>
          <div className="w-full max-w-xl rounded-2xl border border-zinc-700 bg-zinc-900 p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="mb-5 text-lg font-bold">{editingId ? "编辑歌曲" : "添加歌曲"}</h2>

            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="歌曲名 *" value={form.name} onChange={(v) => setField("name", v)} />
                <Field label="歌手 *" value={form.artist} onChange={(v) => setField("artist", v)} />
                <Field label="专辑 *" value={form.album} onChange={(v) => setField("album", v)} />
                <Field label="流派" value={form.genre} onChange={(v) => setField("genre", v)} />
                <Field label="时长（秒）" value={String(form.durationSec)} onChange={(v) => setField("durationSec", v)} type="number" />
                <Field label="发行日期" value={form.releaseDate.slice(0, 10)} onChange={(v) => setField("releaseDate", v)} type="date" />
              </div>

              <div className="border-t border-zinc-800 pt-4">
                <p className="mb-2 text-xs font-medium text-zinc-500">音乐平台链接</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="QQ音乐" value={form.qqMusicUrl} onChange={(v) => setField("qqMusicUrl", v)} placeholder="链接或搜索关键词" />
                  <Field label="网易云" value={form.neteaseUrl} onChange={(v) => setField("neteaseUrl", v)} placeholder="链接或搜索关键词" />
                  <Field label="汽水音乐" value={form.qishuiUrl} onChange={(v) => setField("qishuiUrl", v)} placeholder="链接或搜索关键词" />
                  <Field label="酷我音乐" value={form.kuwoUrl} onChange={(v) => setField("kuwoUrl", v)} placeholder="链接或搜索关键词" />
                </div>
              </div>

              <div className="border-t border-zinc-800 pt-4">
                <p className="mb-2 text-xs font-medium text-zinc-500">封面图片</p>
                <Field label="封面 URL" value={form.coverUrl} onChange={(v) => setField("coverUrl", v)} placeholder="https://..." />
              </div>

              {allCategories.length > 0 && (
                <div className="border-t border-zinc-800 pt-4">
                  <p className="mb-2 text-xs font-medium text-zinc-500">所属分类</p>
                  <div className="flex flex-wrap gap-2">
                    {allCategories.map((c) => {
                      const selected = form.categoryIds.includes(c.id);
                      return (
                        <button key={c.id} type="button" onClick={() => toggleCategory(c.id)} className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${selected ? "border-red-600/50 bg-red-600/20 text-red-300" : "border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600"}`}>
                          <span className="mr-1 inline-block h-2 w-2 rounded-full" style={{ background: c.color || "#666" }} />
                          {c.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {formMsg && <p className={`mt-3 text-sm ${formMsg.type === "err" ? "text-red-400" : "text-emerald-400"}`}>{formMsg.text}</p>}

            <div className="mt-6 flex items-center justify-end gap-3">
              <button type="button" onClick={() => setShowForm(false)} className="rounded-xl border border-zinc-700 px-5 py-2.5 text-sm transition hover:bg-zinc-800">取消</button>
              <button type="button" onClick={submitForm} disabled={formLoading} className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-medium transition hover:bg-red-500 disabled:opacity-50">
                {formLoading ? "提交中..." : editingId ? "保存修改" : "发布歌曲"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setDeleteTarget(null)}>
          <div className="w-full max-w-sm rounded-2xl border border-zinc-700 bg-zinc-900 p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold">确认删除</h3>
            <p className="mt-2 text-sm text-zinc-400">确定要删除歌曲 <span className="font-medium text-zinc-200">&ldquo;{deleteTarget.name}&rdquo;</span> 吗？此操作不可撤销。</p>
            <div className="mt-5 flex items-center justify-end gap-3">
              <button type="button" onClick={() => setDeleteTarget(null)} className="rounded-xl border border-zinc-700 px-5 py-2.5 text-sm transition hover:bg-zinc-800">取消</button>
              <button type="button" onClick={confirmDelete} disabled={deleteLoading} className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-medium transition hover:bg-red-500 disabled:opacity-50">
                {deleteLoading ? "删除中..." : "确认删除"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, type = "text", placeholder }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-zinc-500">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder || label} className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm outline-none transition focus:border-red-500/50" />
    </div>
  );
}
