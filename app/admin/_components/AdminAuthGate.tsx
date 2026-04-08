"use client";

import { useEffect, useState } from "react";

type Props = { children: React.ReactNode };

export default function AdminAuthGate({ children }: Props) {
  const [checked, setChecked] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [auth, setAuth] = useState({ phone: "13800000000", password: "Admin@123456" });
  const [msg, setMsg] = useState("");

  const checkMe = async () => {
    const res = await fetch("/api/auth/me");
    const data = await res.json();
    setAuthed(Boolean(data?.success && data?.data?.role === "admin"));
    setChecked(true);
  };

  useEffect(() => {
    checkMe();
  }, []);

  const doLogin = async () => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(auth),
    });
    const data = await res.json();
    if (!res.ok || !data.success || data.data?.user?.role !== "admin") {
      setMsg("管理员登录失败，请检查账号密码");
      return;
    }
    setMsg("");
    setAuthed(true);
  };

  if (!checked) {
    return <div className="p-6 text-sm text-zinc-400">加载中...</div>;
  }

  if (!authed) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-xl border border-zinc-700 bg-[#212121] p-5">
          <h1 className="text-2xl font-bold mb-2">后台需要管理员登录</h1>
          <p className="text-sm text-zinc-400 mb-4">先登录管理员账号再访问管理功能。</p>
          <div className="space-y-3">
            <input value={auth.phone} onChange={(e) => setAuth({ ...auth, phone: e.target.value })} className="w-full rounded bg-zinc-900 border border-zinc-700 px-3 py-2" placeholder="手机号" />
            <input type="password" value={auth.password} onChange={(e) => setAuth({ ...auth, password: e.target.value })} className="w-full rounded bg-zinc-900 border border-zinc-700 px-3 py-2" placeholder="密码" />
            {msg ? <p className="text-sm text-red-400">{msg}</p> : null}
            <button onClick={doLogin} className="w-full rounded bg-red-600 py-2 font-medium">管理员登录</button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
