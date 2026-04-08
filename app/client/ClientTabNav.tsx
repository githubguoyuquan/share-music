"use client";

import { useEffect, useRef, useState, type FC } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs: { href: string; label: string; Icon: FC<{ className?: string }> }[] = [
  {
    href: "/client",
    label: "首页",
    Icon: ({ className }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M3 10.5L12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-8H9v8H4a1 1 0 0 1-1-1v-10.5z" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: "/client/my-list",
    label: "我的列表",
    Icon: ({ className }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M9 18V5l12-2v13" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="18" cy="16" r="3" />
      </svg>
    ),
  },
  {
    href: "/client/profile",
    label: "我的",
    Icon: ({ className }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 4-6 8-6s8 2 8 6" strokeLinecap="round" />
      </svg>
    ),
  },
];

export default function ClientTabNav() {
  const pathname = usePathname() || "";
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(true);
  const lastY = useRef(0);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      if (y < 60) { setVisible(true); lastY.current = y; return; }
      setVisible(y < lastY.current);
      lastY.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed bottom-0 left-0 right-0 z-40 border-t border-zinc-800 bg-zinc-950/95 backdrop-blur transition-transform duration-300 ${visible ? "translate-y-0" : "translate-y-full"}`}
    >
      <div className="mx-auto grid max-w-3xl grid-cols-3 gap-1 px-2 py-2">
        {tabs.map(({ href, label, Icon }) => {
          let active = false;
          if (mounted) {
            if (href === "/client") {
              active = pathname === "/client" || pathname.startsWith("/client/song/");
              if (pathname.startsWith("/client/my-list") || pathname.startsWith("/client/profile")) active = false;
            } else {
              active = pathname.startsWith(href);
            }
          }
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center gap-1 rounded-xl py-2 transition ${active ? "text-red-500" : "text-zinc-400 hover:text-zinc-200"}`}
            >
              <Icon className="h-6 w-6" />
              <span className="text-[11px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
