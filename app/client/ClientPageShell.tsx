"use client";

import dynamic from "next/dynamic";

const ClientTimelineView = dynamic(() => import("./ClientTimelineView"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-gradient-to-b from-[#060606] via-[#0b0b0b] to-black p-6 md:p-8">
      <div className="mb-8 h-12 w-64 animate-pulse rounded-xl bg-zinc-800/60" />
      <div className="space-y-4">
        <div className="h-24 animate-pulse rounded-2xl bg-zinc-900/80" />
        <div className="h-24 animate-pulse rounded-2xl bg-zinc-900/80" />
        <div className="h-24 animate-pulse rounded-2xl bg-zinc-900/80" />
      </div>
    </div>
  ),
});

export default function ClientPageShell() {
  return <ClientTimelineView />;
}
