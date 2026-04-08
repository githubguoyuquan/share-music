"use client";

import dynamic from "next/dynamic";

const ClientTabNav = dynamic(() => import("./ClientTabNav"), { ssr: false });

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-black text-zinc-100">
      <div className="pb-20">{children}</div>
      <ClientTabNav />
    </div>
  );
}
