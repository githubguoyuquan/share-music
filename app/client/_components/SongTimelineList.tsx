"use client";

type Song = {
  id: string;
  name: string;
  artist: string;
  album: string;
  genre?: string;
  durationSec?: number;
  releaseDate?: string;
};

type Props = {
  songs: Song[];
  onOpenDetail: (song: Song) => void;
  actions?: (song: Song) => React.ReactNode;
  emptyText?: string;
};

const formatDuration = (sec?: number) => {
  if (!sec || Number.isNaN(sec)) return "--:--";
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
};

const monthKeyFromReleaseDate = (releaseDate?: string) => {
  if (!releaseDate) return "未知时间";
  const d = new Date(releaseDate);
  if (Number.isNaN(d.getTime())) return "未知时间";
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
};

const fmtDay = (releaseDate?: string) => {
  if (!releaseDate) return "";
  const d = new Date(releaseDate);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()}`;
};

const compareMonthKeyDesc = (a: string, b: string) => {
  if (a === b) return 0;
  if (a === "未知时间") return 1;
  if (b === "未知时间") return -1;
  return a < b ? 1 : -1;
};

const displayMonth = (key: string) => {
  if (key === "未知时间") return "未知";
  const [y, m] = key.split("-");
  return `${parseInt(m, 10)}月 ${y} 发行`;
};

export default function SongTimelineList({ songs, onOpenDetail, actions, emptyText = "暂无歌曲" }: Props) {
  const groupedByMonth = songs.reduce<Record<string, Song[]>>((acc, song) => {
    const key = monthKeyFromReleaseDate(song.releaseDate);
    if (!acc[key]) acc[key] = [];
    acc[key].push(song);
    return acc;
  }, {});
  const monthKeys = Object.keys(groupedByMonth).sort(compareMonthKeyDesc);

  if (!monthKeys.length) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-zinc-800/60 bg-zinc-900/40 px-6 py-12 text-center">
        <svg className="h-10 w-10 text-zinc-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 18V5l10-2v13" strokeLinecap="round" strokeLinejoin="round" /><circle cx="6" cy="18" r="2.5" /><circle cx="18" cy="16" r="2.5" /></svg>
        <p className="text-sm text-zinc-500">{emptyText}</p>
      </div>
    );
  }

  return (
    <section className="relative pl-4">
      {/* Continuous vertical line */}
      <div className="absolute left-[5px] top-2 bottom-2 w-[2px] rounded-full bg-gradient-to-b from-red-500/60 via-red-900/30 to-zinc-800/20" />

      {monthKeys.map((monthKey) => (
        <div key={monthKey} className="relative pb-4">
          {/* Month node */}
          <div className="relative mb-2 flex items-center">
            <div className="absolute -left-4 flex h-3 w-3 items-center justify-center">
              <div className="h-3 w-3 rounded-full border-2 border-red-500 bg-zinc-950" />
            </div>
            <span className="text-[11px] font-semibold tracking-wide text-red-400/90">{displayMonth(monthKey)}</span>
          </div>

          {/* Song cards */}
          <div className="space-y-2">
            {groupedByMonth[monthKey].map((song) => {
              const day = fmtDay(song.releaseDate);
              return (
                <div
                  key={song.id}
                  className="group relative cursor-pointer overflow-hidden rounded-xl border border-zinc-800/70 bg-zinc-900/80 transition-all duration-200 hover:border-zinc-700/80 hover:bg-zinc-800/60 active:scale-[0.985]"
                  onClick={() => onOpenDetail(song)}
                >
                  <div className="absolute inset-y-0 left-0 w-[2px] bg-gradient-to-b from-red-500/70 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

                  <div className="flex items-center gap-2.5 px-3 py-2.5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-800/80 text-zinc-500 ring-1 ring-white/5">
                      <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M9 18V5l10-2v13" strokeLinecap="round" strokeLinejoin="round" /><circle cx="6" cy="18" r="2.5" /><circle cx="18" cy="16" r="2.5" /></svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-zinc-100 group-hover:text-white">{song.name}</p>
                      <p className="mt-0.5 truncate text-[11px] text-zinc-400">{song.artist}<span className="mx-1 text-zinc-600">·</span>{song.album}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <div className="hidden flex-col items-end sm:flex">
                        {day && <span className="text-[10px] tabular-nums text-zinc-500">{day}</span>}
                        <span className="text-[10px] tabular-nums text-zinc-600">{formatDuration(song.durationSec)}</span>
                      </div>
                      {actions ? <div>{actions(song)}</div> : (
                        <svg className="h-3.5 w-3.5 text-zinc-600 transition group-hover:text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 border-t border-zinc-800/40 px-3 py-1">
                    <span className="inline-flex items-center gap-0.5 rounded bg-red-500/10 px-1.5 py-px text-[10px] text-red-400/80">{song.genre || "未分类"}</span>
                    <span className="text-[10px] text-zinc-600">{formatDuration(song.durationSec)}</span>
                    {day && <span className="text-[10px] text-zinc-600 sm:hidden">{day}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </section>
  );
}
