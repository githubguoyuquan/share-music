"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function ClientAuthInner() {
  const [isLogin, setIsLogin] = useState(true);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const params = useSearchParams();
  const next = useMemo(() => params.get("next") || "/client", [params]);

  const submit = async () => {
    setLoading(true);
    setError("");
    const url = isLogin ? "/api/auth/login" : "/api/auth/register";
    const body = isLogin ? { phone, password } : { phone, password, nickname };
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok || !data.success) {
      setError(data.error || "登录失败");
      return;
    }
    router.push(next);
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 p-6 flex items-center justify-center">
      <div className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-900 p-6">
        <h1 className="text-2xl font-bold mb-4">{isLogin ? "手机号登录" : "手机号注册"}</h1>
        <div className="space-y-3">
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="手机号" className="w-full rounded bg-zinc-950 border border-zinc-700 px-3 py-2" />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="密码" className="w-full rounded bg-zinc-950 border border-zinc-700 px-3 py-2" />
          {!isLogin && <input value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="昵称（可选）" className="w-full rounded bg-zinc-950 border border-zinc-700 px-3 py-2" />}
          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          <button disabled={loading} onClick={submit} className="w-full rounded bg-red-600 py-2 font-medium disabled:opacity-60">{loading ? "提交中..." : isLogin ? "登录" : "注册"}</button>
          <button onClick={() => setIsLogin((v) => !v)} className="w-full rounded border border-zinc-700 py-2 text-sm">{isLogin ? "没有账号？去注册" : "已有账号？去登录"}</button>
        </div>
      </div>
    </div>
  );
}

export default function ClientAuthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black text-zinc-100 p-6">加载中...</div>}>
      <ClientAuthInner />
    </Suspense>
  );
}
