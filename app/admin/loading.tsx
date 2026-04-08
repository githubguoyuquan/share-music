export default function AdminLoading() {
  return (
    <div className="min-h-screen bg-[#0f0f0f] p-6">
      <div className="h-10 w-56 animate-pulse rounded bg-zinc-800" />
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="h-44 animate-pulse rounded-xl bg-zinc-900" />
        <div className="h-44 animate-pulse rounded-xl bg-zinc-900" />
      </div>
    </div>
  );
}
