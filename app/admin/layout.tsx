import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const links = [
    { href: "/admin", label: "仪表盘" },
    { href: "/admin/categories", label: "分类管理" },
    { href: "/admin/songs", label: "歌曲管理" },
  ];

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-zinc-100 grid grid-cols-[210px_1fr]">
      <aside className="border-r border-zinc-800 bg-[#111] p-4 min-h-screen">
        <h1 className="mb-5 px-2 text-lg font-bold">YouTube Dark 后台</h1>
        <nav className="space-y-2 text-sm">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="block rounded-lg border border-zinc-800 px-3 py-2 hover:border-zinc-600 hover:bg-zinc-900">
              {l.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="p-6">{children}</main>
    </div>
  );
}
