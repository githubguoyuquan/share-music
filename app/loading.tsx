export default function AppLoading() {
  return (
    <div className="min-h-screen bg-black p-6">
      <div className="h-10 w-52 animate-pulse rounded bg-zinc-800" />
      <div className="mt-6 space-y-3">
        <div className="h-24 animate-pulse rounded-xl bg-zinc-900" />
        <div className="h-24 animate-pulse rounded-xl bg-zinc-900" />
      </div>
    </div>
  );
}
