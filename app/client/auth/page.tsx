"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";

function ClientAuthInner() {
  const [isLogin, setIsLogin] = useState(true);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const params = useSearchParams();
  const next = params.get("next") || "/client";

  const submit = async () => {
    if (loading) return;
    const trimmedPhone = phone.trim();
    if (!/^1[3-9]\d{9}$/.test(trimmedPhone)) {
      setError("请输入正确的手机号");
      return;
    }
    const trimmedPassword = password.trim();
    if (trimmedPassword.length < 6) {
      setError("密码至少 6 位");
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");
    const url = isLogin ? "/api/auth/login" : "/api/auth/register";
    const body = isLogin
      ? { phone: trimmedPhone, password: trimmedPassword }
      : { phone: trimmedPhone, password: trimmedPassword, nickname: nickname.trim() || undefined };
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      let data: any = null;
      try { data = await res.json(); } catch { /* ignore */ }
      if (!res.ok || !data?.success) {
        setError(data?.error || (isLogin ? "登录失败，请检查账号密码" : "注册失败，请稍后重试"));
        setLoading(false);
        return;
      }
      setSuccess(isLogin ? "登录成功，正在跳转..." : "注册成功，正在跳转...");
      window.location.href = next;
    } catch {
      setLoading(false);
      setError("网络异常，请检查网络连接");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-black p-6 text-zinc-100">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-fuchsia-600">
            <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 18V5l10-2v13" strokeLinecap="round" strokeLinejoin="round"/><circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="16" r="2.5"/></svg>
          </div>
          <h1 className="text-xl font-bold">{isLogin ? "登录" : "注册"}</h1>
          <p className="mt-1 text-sm text-zinc-500">Share Music · 分享你的音乐品味</p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5">
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs text-zinc-400">手机号</label>
              <input
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="请输入手机号"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm outline-none transition focus:border-red-500/50"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-400">密码</label>
              <input
                type="password"
                autoComplete={isLogin ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码（至少6位）"
                onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm outline-none transition focus:border-red-500/50"
              />
            </div>
            {!isLogin && (
              <div>
                <label className="mb-1 block text-xs text-zinc-400">昵称（可选）</label>
                <input
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="给自己取个名字"
                  onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm outline-none transition focus:border-red-500/50"
                />
              </div>
            )}

            {error && <p className="rounded-lg bg-red-950/50 px-3 py-2 text-sm text-red-400">{error}</p>}
            {success && <p className="rounded-lg bg-emerald-950/50 px-3 py-2 text-sm text-emerald-400">{success}</p>}

            <button
              type="button"
              disabled={loading}
              onClick={submit}
              className="w-full rounded-xl bg-red-600 py-3 text-sm font-bold text-white transition hover:bg-red-500 active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? "提交中..." : isLogin ? "登录" : "注册"}
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={() => { setIsLogin((v) => !v); setError(""); setSuccess(""); }}
              className="w-full rounded-xl border border-zinc-700 py-3 text-sm text-zinc-400 transition hover:border-zinc-500 hover:text-zinc-200 disabled:opacity-50"
            >
              {isLogin ? "没有账号？去注册" : "已有账号？去登录"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ClientAuthPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-black text-zinc-500">加载中...</div>}>
      <ClientAuthInner />
    </Suspense>
  );
}
