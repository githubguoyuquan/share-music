"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Stats = { songCount: number; categoryCount: number; userCount: number; recentSongs: { id: string; name: string; artist: string; createdAt: string }[] };

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/admin/stats").then((r) => r.json()).then((d) => {
      if (d.success) setStats(d.data);
    });
  }, []);

  const cards = [
    { label: "歌曲总数", value: stats?.songCount ?? "—", icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 18V5l10-2v13" strokeLinecap="round" strokeLinejoin="round"/><circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="16" r="2.5"/></svg>
    ), color: "from-red-500/20 to-red-900/10 border-red-800/30", textColor: "text-red-400" },
    { label: "分类总数", value: stats?.categoryCount ?? "—", icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><circle cx="7" cy="7" r="1.5" fill="currentColor"/></svg>
    ), color: "from-violet-500/20 to-violet-900/10 border-violet-800/30", textColor: "text-violet-400" },
    { label: "注册用户", value: stats?.userCount ?? "—", icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4v2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" strokeLinecap="round" strokeLinejoin="round"/></svg>
    ), color: "from-emerald-500/20 to-emerald-900/10 border-emerald-800/30", textColor: "text-emerald-400" },
  ];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">仪表盘</h1>

      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className={`rounded-2xl border bg-gradient-to-br p-5 ${c.color}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-zinc-500">{c.label}</p>
                <p className={`mt-1 text-3xl font-bold ${c.textColor}`}>{stats ? c.value : <span className="inline-block h-8 w-16 animate-pulse rounded bg-zinc-800" />}</p>
              </div>
              <div className={`${c.textColor} opacity-60`}>{c.icon}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
          <h2 className="mb-4 text-sm font-semibold text-zinc-300">最近添加</h2>
          {!stats ? (
            <div className="space-y-3">{[1,2,3].map((i) => <div key={i} className="h-10 animate-pulse rounded-lg bg-zinc-800/60" />)}</div>
          ) : stats.recentSongs.length === 0 ? (
            <p className="text-sm text-zinc-600">暂无歌曲</p>
          ) : (
            <div className="space-y-2">
              {stats.recentSongs.map((s) => (
                <div key={s.id} className="flex items-center justify-between rounded-xl border border-zinc-800/50 bg-zinc-900/60 px-4 py-2.5">
                  <div>
                    <p className="text-sm font-medium text-zinc-200">{s.name}</p>
                    <p className="text-xs text-zinc-500">{s.artist}</p>
                  </div>
                  <span className="text-[11px] text-zinc-600">{new Date(s.createdAt).toLocaleDateString("zh-CN")}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
          <h2 className="mb-4 text-sm font-semibold text-zinc-300">快速操作</h2>
          <div className="space-y-2">
            <Link href="/admin/songs" className="flex items-center gap-3 rounded-xl border border-zinc-800/50 bg-zinc-900/60 px-4 py-3 text-sm text-zinc-300 transition hover:border-zinc-700 hover:bg-zinc-800/60">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 18V5l10-2v13" strokeLinecap="round" strokeLinejoin="round"/><circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="16" r="2.5"/></svg>
              管理歌曲
              <svg className="ml-auto h-4 w-4 text-zinc-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </Link>
            <Link href="/admin/categories" className="flex items-center gap-3 rounded-xl border border-zinc-800/50 bg-zinc-900/60 px-4 py-3 text-sm text-zinc-300 transition hover:border-zinc-700 hover:bg-zinc-800/60">
              <svg className="h-5 w-5 text-violet-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><circle cx="7" cy="7" r="1.5" fill="currentColor"/></svg>
              管理分类
              <svg className="ml-auto h-4 w-4 text-zinc-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
