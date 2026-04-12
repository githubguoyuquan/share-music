"use client";

import dynamic from "next/dynamic";
import { AuthProvider } from "./AuthContext";
import ClientScrollRestoration from "./ClientScrollRestoration";

const ClientTabNav = dynamic(() => import("./ClientTabNav"), { ssr: false });

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-black text-zinc-100">
        <ClientScrollRestoration>
          <div className="pb-20">{children}</div>
        </ClientScrollRestoration>
        <ClientTabNav />
      </div>
    </AuthProvider>
  );
}
