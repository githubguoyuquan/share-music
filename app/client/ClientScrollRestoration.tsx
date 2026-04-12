"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const storageKey = (path: string) => `clientNavScroll:${path}`;

/**
 * Persists window scroll per client route so bottom-tab switches don't jump to top.
 * Pair with <Link scroll={false}> and optional click-time saves from the tab bar.
 *
 * Important: we must NOT save scroll in a pathname effect cleanup — that runs after
 * navigation when `window.scrollY` may already be the new page (often 0), overwriting
 * the correct value saved on tab click.
 */
export default function ClientScrollRestoration({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "";
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;
  const ignoreScrollPersistUntilRef = useRef(0);

  useEffect(() => {
    ignoreScrollPersistUntilRef.current = performance.now() + 180;
  }, [pathname]);

  useEffect(() => {
    let raf = 0;
    const flush = () => {
      raf = 0;
      const p = pathnameRef.current;
      if (!p.startsWith("/client")) return;
      if (performance.now() < ignoreScrollPersistUntilRef.current) return;
      sessionStorage.setItem(storageKey(p), String(window.scrollY));
    };
    const onScroll = () => {
      if (raf !== 0) return;
      raf = requestAnimationFrame(flush);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf !== 0) cancelAnimationFrame(raf);
    };
  }, []);

  useEffect(() => {
    if (!pathname.startsWith("/client")) return;
    const key = storageKey(pathname);
    const raw = sessionStorage.getItem(key);
    if (raw == null) {
      window.scrollTo(0, 0);
      return;
    }
    const y = Number(raw);
    if (Number.isNaN(y)) return;

    let cancelled = false;
    const timeouts: ReturnType<typeof setTimeout>[] = [];

    const tryRestore = () => {
      if (cancelled) return false;
      const maxScrollable = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      const target = Math.min(y, maxScrollable);
      window.scrollTo(0, target);
      return maxScrollable + 4 >= y;
    };

    let rafTries = 0;
    const maxRafTries = 40;
    const rafLoop = () => {
      if (cancelled) return;
      const done = tryRestore();
      if (done || rafTries >= maxRafTries) return;
      rafTries += 1;
      requestAnimationFrame(rafLoop);
    };
    requestAnimationFrame(() => requestAnimationFrame(rafLoop));

    for (const ms of [80, 200, 450, 900]) {
      timeouts.push(
        window.setTimeout(() => {
          if (!cancelled) tryRestore();
        }, ms)
      );
    }

    return () => {
      cancelled = true;
      timeouts.forEach((id) => clearTimeout(id));
    };
  }, [pathname]);

  return <>{children}</>;
}

export { storageKey as clientScrollStorageKey };
