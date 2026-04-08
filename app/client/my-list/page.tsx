"use client";

import dynamic from "next/dynamic";

const MyListView = dynamic(() => import("./MyListView"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-gradient-to-b from-[#060606] to-black p-4 md:p-6">
      <div className="mb-5 h-8 w-40 animate-pulse rounded-lg bg-zinc-800/60" />
      <div className="mb-5 h-12 animate-pulse rounded-xl bg-zinc-900/80" />
      <div className="space-y-3">
        <div className="h-20 animate-pulse rounded-lg bg-zinc-900/80" />
        <div className="h-20 animate-pulse rounded-lg bg-zinc-900/80" />
        <div className="h-20 animate-pulse rounded-lg bg-zinc-900/80" />
      </div>
    </div>
  ),
});

export default function MyListPage() {
  return <MyListView />;
}
