import Link from "next/link";
import AdminAuthGate from "./_components/AdminAuthGate";

export default function AdminHomePage() {
  return (
    <AdminAuthGate>
      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/admin/songs" className="rounded-xl border border-zinc-700 bg-[#212121] p-5 hover:border-zinc-500">
          <h2 className="text-lg font-semibold">歌曲管理</h2>
          <p className="mt-2 text-sm text-zinc-400">新增、查看歌曲，默认按发行时间倒序。</p>
        </Link>
        <Link href="/admin/categories" className="rounded-xl border border-zinc-700 bg-[#212121] p-5 hover:border-zinc-500">
          <h2 className="text-lg font-semibold">分类字段管理</h2>
          <p className="mt-2 text-sm text-zinc-400">维护歌曲分类字段（非流派）。</p>
        </Link>
        <div className="rounded-xl border border-zinc-700 bg-[#212121] p-5">
          <h2 className="text-lg font-semibold">系统状态</h2>
          <p className="mt-2 text-sm text-zinc-400">后台已拆分为独立页面，可按导航进入。</p>
        </div>
      </div>
    </AdminAuthGate>
  );
}
