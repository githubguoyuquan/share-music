"use client";

import { useEffect, useState } from "react";
import AdminAuthGate from "../_components/AdminAuthGate";

type Song = { id: string; name: string; artist: string; album: string; durationSec: number; releaseDate: string; genre: string };

export default function AdminSongsPage() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [song, setSong] = useState<any>({ name: "", artist: "", album: "", durationSec: 180, releaseDate: "2024-01-01", genre: "流行", categoryIds: [] });

  const fmtDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.getUTCFullYear()}/${String(d.getUTCMonth() + 1).padStart(2, "0")}/${String(d.getUTCDate()).padStart(2, "0")}`;
  };

  const load = async (nextPage = page) => {
    const res = await fetch(`/api/admin/songs?page=${nextPage}&pageSize=${pageSize}`);
    const data = await res.json();
    if (data.success) {
      setSongs(data.data.items);
      setPage(data.data.page);
      setTotalPages(data.data.totalPages || 1);
    }
  };

  useEffect(() => { load(); }, []);

  const createSong = async () => {
    await fetch("/api/admin/songs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(song),
    });
    load(page);
  };

  return (
    <AdminAuthGate>
      <section className="rounded-xl border border-zinc-700 bg-[#212121] p-4">
        <h2 className="text-xl mb-3">添加歌曲</h2>
        <div className="grid grid-cols-2 gap-2">
          {[ ["name", "歌曲名"], ["artist", "歌手"], ["album", "专辑"], ["genre", "流派"] ].map(([k, p]) => (
            <input key={k} value={song[k]} onChange={(e) => setSong({ ...song, [k]: e.target.value })} placeholder={p} className="rounded bg-zinc-900 border border-zinc-700 px-3 py-2" />
          ))}
          <input type="number" value={song.durationSec} onChange={(e) => setSong({ ...song, durationSec: Number(e.target.value) })} placeholder="时长(秒)" className="rounded bg-zinc-900 border border-zinc-700 px-3 py-2" />
          <input type="date" value={song.releaseDate.slice(0, 10)} onChange={(e) => setSong({ ...song, releaseDate: e.target.value })} className="rounded bg-zinc-900 border border-zinc-700 px-3 py-2" />
        </div>
        <button onClick={createSong} className="mt-3 px-4 py-2 rounded bg-red-600">发布歌曲</button>
      </section>

      <section className="mt-6 rounded-xl border border-zinc-700 bg-[#212121] p-4">
        <h2 className="text-xl mb-3">歌曲列表（发行时间倒序）</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-zinc-400 border-b border-zinc-700"><th className="py-2 text-left">歌曲</th><th>歌手</th><th>专辑</th><th>时长</th><th>发行时间</th><th>流派</th></tr></thead>
            <tbody>{songs.map((s) => <tr key={s.id} className="border-b border-zinc-800"><td className="py-2">{s.name}</td><td>{s.artist}</td><td>{s.album}</td><td>{Math.floor(s.durationSec / 60)}:{String(s.durationSec % 60).padStart(2, "0")}</td><td>{fmtDate(s.releaseDate)}</td><td>{s.genre}</td></tr>)}</tbody>
          </table>
        </div>
        <div className="mt-4 flex items-center justify-end gap-2 text-sm">
          <button
            disabled={page <= 1}
            onClick={() => load(page - 1)}
            className="rounded border border-zinc-700 px-3 py-1 disabled:opacity-40"
          >
            上一页
          </button>
          <span className="text-zinc-400">第 {page} / {totalPages} 页</span>
          <button
            disabled={page >= totalPages}
            onClick={() => load(page + 1)}
            className="rounded border border-zinc-700 px-3 py-1 disabled:opacity-40"
          >
            下一页
          </button>
        </div>
      </section>
    </AdminAuthGate>
  );
}
