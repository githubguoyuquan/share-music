"use client";

import dynamic from "next/dynamic";

const ProfileView = dynamic(() => import("./ProfileView"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-black p-4 md:p-6">
      <div className="mb-4 h-8 w-36 animate-pulse rounded-lg bg-zinc-800/60" />
      <div className="mb-4 h-24 animate-pulse rounded-xl bg-zinc-900/80" />
      <div className="grid gap-3 md:grid-cols-3">
        <div className="h-20 animate-pulse rounded-xl bg-zinc-900/80" />
        <div className="h-20 animate-pulse rounded-xl bg-zinc-900/80" />
        <div className="h-20 animate-pulse rounded-xl bg-zinc-900/80" />
      </div>
    </div>
  ),
});

export default function ProfilePage() {
  return <ProfileView />;
}
