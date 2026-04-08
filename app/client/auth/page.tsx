"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../AuthContext";

function ClientAuthInner() {
  const [isLogin, setIsLogin] = useState(true);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const params = useSearchParams();
  const next = useMemo(() => params.get("next") || "/client", [params]);
  const { refresh } = useAuth();

  const submit = async () => {
    if (loading) return;
    if (!/^1[3-9]\d{9}$/.test(phone.trim())) {
      setError("请输入正确的手机号");
      return;
    }
    if (password.length < 6) {
      setError("密码至少 6 位");
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");
    const url = isLogin ? "/api/auth/login" : "/api/auth/register";
    const body = isLogin ? { phone, password } : { phone, password, nickname };
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      let data: any = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }
      if (!res.ok || !data?.success) {
        setError(data?.error || (isLogin ? "登录失败，请稍后重试" : "注册失败，请稍后重试"));
        setLoading(false);
        return;
      }
      setSuccess(isLogin ? "登录成功，正在跳转..." : "注册成功，正在跳转...");
      await refresh();
      setLoading(false);
      router.push(next);
    } catch {
      setLoading(false);
      setError("网络异常，请检查服务是否已启动");
    }
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 p-6 flex items-center justify-center">
      <div className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-900 p-6">
        <h1 className="text-2xl font-bold mb-4">{isLogin ? "手机号登录" : "手机号注册"}</h1>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="手机号" className="w-full rounded bg-zinc-950 border border-zinc-700 px-3 py-2" />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="密码" className="w-full rounded bg-zinc-950 border border-zinc-700 px-3 py-2" />
          {!isLogin && <input value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="昵称（可选）" className="w-full rounded bg-zinc-950 border border-zinc-700 px-3 py-2" />}
          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          {success ? <p className="text-sm text-emerald-400">{success}</p> : null}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-red-600 py-2 font-medium disabled:opacity-60"
          >
            {loading ? "提交中..." : isLogin ? "登录" : "注册"}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => {
              setIsLogin((v) => !v);
              setError("");
              setSuccess("");
            }}
            className="w-full rounded border border-zinc-700 py-2 text-sm disabled:opacity-60"
          >
            {isLogin ? "没有账号？去注册" : "已有账号？去登录"}
          </button>
        </form>
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
