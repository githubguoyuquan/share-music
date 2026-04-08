import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-8">
      <h1 className="text-3xl font-bold mb-4">Music Share App</h1>
      <p className="text-zinc-400 mb-6">Next.js + Prisma + PostgreSQL + Tailwind</p>
      <div className="flex gap-3">
        <Link href="/admin" className="px-4 py-2 rounded bg-red-600">后台（YouTube Dark）</Link>
        <Link href="/client" className="px-4 py-2 rounded bg-zinc-700">客户端（YouTube Music）</Link>
      </div>
    </div>
  );
}
