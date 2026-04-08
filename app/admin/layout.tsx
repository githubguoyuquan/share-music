"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const NAV = [
  { href: "/admin", label: "仪表盘", icon: (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>
  )},
  { href: "/admin/songs", label: "歌曲管理", icon: (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 18V5l10-2v13" strokeLinecap="round" strokeLinejoin="round"/><circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="16" r="2.5"/></svg>
  )},
  { href: "/admin/categories", label: "分类管理", icon: (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><circle cx="7" cy="7" r="1.5" fill="currentColor"/></svg>
  )},
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "";
  const [authed, setAuthed] = useState(false);
  const [checked, setChecked] = useState(false);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loginMsg, setLoginMsg] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then((d) => {
      setAuthed(Boolean(d?.success && d?.data?.role === "admin"));
      setChecked(true);
    }).catch(() => setChecked(true));
  }, []);

  const doLogin = async () => {
    if (!phone.trim() || !password.trim()) { setLoginMsg("请输入手机号和密码"); return; }
    setLoginLoading(true);
    setLoginMsg("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password }),
      });
      const data = await res.json();
      setLoginLoading(false);
      if (!res.ok || !data.success || data.data?.user?.role !== "admin") {
        setLoginMsg(data.error || "管理员登录失败");
        return;
      }
      setAuthed(true);
    } catch {
      setLoginLoading(false);
      setLoginMsg("网络错误，请重试");
    }
  };

  const doLogout = async () => {
    await fetch("/api/auth/me", { method: "DELETE" });
    setAuthed(false);
    setPhone("");
    setPassword("");
  };

  if (!checked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-600 border-t-red-500" />
      </div>
    );
  }

  if (!authed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] p-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-red-700">
              <svg className="h-7 w-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 18V5l10-2v13" strokeLinecap="round" strokeLinejoin="round"/><circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="16" r="2.5"/></svg>
            </div>
            <h1 className="text-xl font-bold text-zinc-100">Share Music 后台</h1>
            <p className="mt-1 text-sm text-zinc-500">请使用管理员账号登录</p>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 shadow-xl">
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-400">手机号</label>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="请输入手机号" className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none transition focus:border-red-500/50" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-400">密码</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") doLogin(); }} placeholder="请输入密码" className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none transition focus:border-red-500/50" />
              </div>
              {loginMsg && <p className="text-sm text-red-400">{loginMsg}</p>}
              <button type="button" onClick={doLogin} disabled={loginLoading} className="w-full rounded-xl bg-red-600 py-3 text-sm font-bold text-white transition hover:bg-red-500 disabled:opacity-50">
                {loginLoading ? "登录中..." : "管理员登录"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isActive = (href: string) => href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 lg:grid lg:grid-cols-[220px_1fr]">
      {/* Mobile header */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-zinc-800 bg-[#0a0a0a]/95 px-4 py-3 backdrop-blur lg:hidden">
        <button type="button" onClick={() => setSidebarOpen(!sidebarOpen)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-700 text-zinc-300">
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" /></svg>
        </button>
        <span className="text-sm font-bold">Share Music 后台</span>
        <div className="w-9" />
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-[220px] border-r border-zinc-800 bg-[#0f0f0f] transition-transform duration-200 lg:static lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-full flex-col">
          <div className="flex items-center gap-2.5 border-b border-zinc-800/60 px-5 py-5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-red-500 to-red-700">
              <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18V5l10-2v13" strokeLinecap="round" strokeLinejoin="round"/><circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="16" r="2.5"/></svg>
            </div>
            <span className="text-sm font-bold tracking-wide">Share Music</span>
          </div>

          <nav className="flex-1 space-y-1 px-3 py-4">
            {NAV.map((item) => {
              const active = isActive(item.href);
              return (
                <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${active ? "bg-red-600/15 text-red-400" : "text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200"}`}>
                  <span className={active ? "text-red-400" : "text-zinc-500"}>{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-zinc-800/60 p-3">
            <button type="button" onClick={doLogout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-zinc-500 transition hover:bg-zinc-800/60 hover:text-zinc-300">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round"/></svg>
              退出登录
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="min-h-screen p-4 md:p-6">{children}</main>
    </div>
  );
}
