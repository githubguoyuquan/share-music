import Link from "next/link";

export default function CoverPage() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-black text-white selection:bg-red-500/30">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-red-600/15 blur-[140px]" />
        <div className="absolute -right-32 top-[20%] h-[400px] w-[400px] rounded-full bg-fuchsia-600/12 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[30%] h-[350px] w-[350px] rounded-full bg-violet-600/10 blur-[100px]" />
        <div className="absolute right-[20%] bottom-[30%] h-[200px] w-[200px] rounded-full bg-rose-500/8 blur-[80px]" />
      </div>

      {/* Subtle grid pattern */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.015]" style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />

      {/* Floating notes */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <span className="absolute left-[8%] top-[18%] text-[80px] leading-none text-white/[0.03] animate-pulse" style={{ animationDuration: "4s" }}>♪</span>
        <span className="absolute right-[12%] top-[12%] text-[60px] leading-none text-white/[0.04] animate-pulse" style={{ animationDuration: "5s", animationDelay: "1s" }}>♫</span>
        <span className="absolute left-[25%] bottom-[22%] text-[70px] leading-none text-white/[0.03] animate-pulse" style={{ animationDuration: "6s", animationDelay: "2s" }}>♬</span>
        <span className="absolute right-[8%] bottom-[18%] text-[90px] leading-none text-white/[0.025] animate-pulse" style={{ animationDuration: "4.5s", animationDelay: "0.5s" }}>♩</span>
        <span className="absolute left-[55%] top-[8%] text-[50px] leading-none text-white/[0.035] animate-pulse" style={{ animationDuration: "5.5s", animationDelay: "1.5s" }}>♪</span>
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 pt-6 md:px-12 md:pt-10">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-fuchsia-600">
            <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="6" cy="12" r="2.2" /><circle cx="18" cy="6" r="2.2" /><circle cx="18" cy="18" r="2.2" />
              <path d="M8 11l7.5-4M8 13l7.5 4" />
            </svg>
          </div>
          <span className="text-base font-bold tracking-wide">Share Music</span>
        </div>
        <div />
      </header>

      {/* Main hero */}
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pb-12 text-center">
        {/* Animated icon */}
        <div className="mb-10 flex h-28 w-28 items-center justify-center rounded-[2rem] bg-gradient-to-br from-red-500 via-fuchsia-500 to-violet-600 shadow-[0_0_80px_rgba(239,68,68,0.25),0_0_40px_rgba(168,85,247,0.15)]">
          <svg viewBox="0 0 24 24" className="h-14 w-14 text-white drop-shadow-lg" fill="none" stroke="currentColor" strokeWidth="1.4">
            <path d="M9 18V5l10-2v13" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="6" cy="18" r="3" />
            <circle cx="18" cy="16" r="3" />
          </svg>
        </div>

        <h1 className="max-w-xl text-[2.75rem] font-extrabold leading-[1.1] tracking-tight md:text-6xl">
          发现音乐
          <br />
          <span className="bg-gradient-to-r from-red-400 via-fuchsia-400 to-violet-400 bg-clip-text text-transparent">分享热爱</span>
        </h1>

        <p className="mx-auto mt-6 max-w-sm text-[15px] leading-relaxed text-zinc-400 md:max-w-md md:text-base">
          用时间线记录每一首打动你的歌，收藏到你的专属歌单，一键跳转各大音乐平台收听
        </p>

        {/* CTA */}
        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
          <Link href="/client/auth?next=%2Fclient" className="flex w-56 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-red-500 to-fuchsia-600 py-4 text-[15px] font-bold shadow-lg shadow-red-700/20 transition hover:shadow-red-700/35 hover:brightness-110 active:scale-[0.97] sm:w-auto sm:px-10">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h6v6M14 10l6.1-6.1M9 21H3v-6M10 14l-6.1 6.1" strokeLinecap="round" strokeLinejoin="round"/></svg>
            立即开始
          </Link>
          <Link href="/client/auth?next=%2Fclient" className="flex w-56 items-center justify-center rounded-2xl border border-zinc-700 bg-zinc-900/40 py-4 text-[15px] font-medium text-zinc-300 transition hover:border-zinc-500 hover:bg-zinc-800/50 active:scale-[0.97] sm:w-auto sm:px-10">
            登录 / 注册
          </Link>
        </div>

        {/* Features */}
        <div className="mt-20 grid w-full max-w-2xl gap-3 sm:grid-cols-3">
          <div className="group rounded-2xl border border-zinc-800/50 bg-zinc-900/30 p-5 text-left backdrop-blur-sm transition hover:border-zinc-700/60 hover:bg-zinc-900/50">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-red-500/10 text-red-400 transition group-hover:bg-red-500/15">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M8 2v4M16 2v4M3 10h18" strokeLinecap="round"/></svg>
            </div>
            <h3 className="text-[13px] font-bold text-zinc-100">时间线浏览</h3>
            <p className="mt-1.5 text-[11px] leading-relaxed text-zinc-500">按发行时间排列，一目了然</p>
          </div>
          <div className="group rounded-2xl border border-zinc-800/50 bg-zinc-900/30 p-5 text-left backdrop-blur-sm transition hover:border-zinc-700/60 hover:bg-zinc-900/50">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-fuchsia-500/10 text-fuchsia-400 transition group-hover:bg-fuchsia-500/15">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
            </div>
            <h3 className="text-[13px] font-bold text-zinc-100">收藏管理</h3>
            <p className="mt-1.5 text-[11px] leading-relaxed text-zinc-500">自建分类，打造专属歌单</p>
          </div>
          <div className="group rounded-2xl border border-zinc-800/50 bg-zinc-900/30 p-5 text-left backdrop-blur-sm transition hover:border-zinc-700/60 hover:bg-zinc-900/50">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400 transition group-hover:bg-violet-500/15">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5,3 19,12 5,21" strokeLinejoin="round"/></svg>
            </div>
            <h3 className="text-[13px] font-bold text-zinc-100">一键播放</h3>
            <p className="mt-1.5 text-[11px] leading-relaxed text-zinc-500">直达 QQ 音乐、网易云等平台</p>
          </div>
        </div>

        {/* App badges / platforms */}
        <div className="mt-12 flex items-center gap-4 text-zinc-600">
          <span className="text-[11px]">支持平台</span>
          <div className="flex gap-3 text-zinc-500">
            <span className="rounded-lg bg-zinc-900/60 px-3 py-1 text-[11px] ring-1 ring-zinc-800/50">QQ 音乐</span>
            <span className="rounded-lg bg-zinc-900/60 px-3 py-1 text-[11px] ring-1 ring-zinc-800/50">网易云</span>
            <span className="rounded-lg bg-zinc-900/60 px-3 py-1 text-[11px] ring-1 ring-zinc-800/50">汽水音乐</span>
            <span className="rounded-lg bg-zinc-900/60 px-3 py-1 text-[11px] ring-1 ring-zinc-800/50">酷我</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-zinc-900/80 py-6 text-center text-[11px] text-zinc-600">
        Share Music · 分享你的音乐品味
      </footer>
    </div>
  );
}
