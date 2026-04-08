export default function AdminLoading() {
  return (
    <div>
      <div className="mb-6 h-8 w-48 animate-pulse rounded-lg bg-zinc-800/60" />
      <div className="grid gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-zinc-800/40" />
        ))}
      </div>
      <div className="mt-8 h-64 animate-pulse rounded-2xl bg-zinc-800/30" />
    </div>
  );
}
