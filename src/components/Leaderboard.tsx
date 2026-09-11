import { useQuery } from "@tanstack/react-query";
import { getLeaderboard } from "@/lib/leaderboard.functions";
import { getPlayerId } from "@/lib/player";

export const leaderboardQueryKey = ["leaderboard"];

export function Leaderboard({ compact = false }: { compact?: boolean }) {
  const { data, isLoading } = useQuery({
    queryKey: leaderboardQueryKey,
    queryFn: () => getLeaderboard(),
    staleTime: 15_000,
  });

  const myId = typeof window !== "undefined" ? getPlayerId() : "";
  const rows = (data ?? []).slice(0, compact ? 5 : 20);

  return (
    <div className="mx-auto w-full max-w-md rounded-xl border border-white/10 bg-white/5 p-4 text-left">
      <p className="mb-3 text-sm font-bold uppercase tracking-widest text-cyan-300">
        Worldwide top distance
      </p>
      {isLoading && <p className="text-sm text-white/50">Loading…</p>}
      {!isLoading && rows.length === 0 && (
        <p className="text-sm text-white/50">No runs yet — be the first!</p>
      )}
      <ol className="max-h-64 space-y-1 overflow-y-auto">
        {rows.map((entry, i) => (
          <li
            key={entry.player_id}
            className={`flex items-center justify-between rounded px-2 py-1 font-mono text-sm ${
              entry.player_id === myId ? "bg-cyan-500/20 text-cyan-200" : "text-white/80"
            }`}
          >
            <span className="truncate">
              <span className="mr-2 text-white/40">{i + 1}.</span>
              {entry.name}
            </span>
            <span>{entry.best_distance.toLocaleString()} m</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
