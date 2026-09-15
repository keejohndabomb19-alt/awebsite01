import { useQuery } from "@tanstack/react-query";
import { getLeaderboard, getWeeklyLeaderboard } from "@/lib/leaderboard.functions";
import { getPlayerId } from "@/lib/player";
import { useState } from "react";

export const leaderboardQueryKey = ["leaderboard"];
export const weeklyLeaderboardQueryKey = ["weekly-leaderboard"];

const PRIZES = [500, 250, 100];

export function Leaderboard({ compact = false }: { compact?: boolean }) {
  const [tab, setTab] = useState<"weekly" | "worldwide">("weekly");
  const weekly = useQuery({
    queryKey: weeklyLeaderboardQueryKey,
    queryFn: () => getWeeklyLeaderboard(),
    staleTime: 15_000,
  });
  const worldwide = useQuery({
    queryKey: leaderboardQueryKey,
    queryFn: () => getLeaderboard(),
    staleTime: 15_000,
  });
  const isWeekly = tab === "weekly";
  const data = isWeekly ? weekly.data : worldwide.data;
  const isLoading = isWeekly ? weekly.isLoading : worldwide.isLoading;

  const myId = typeof window !== "undefined" ? getPlayerId() : "";
  const rows = (data ?? []).slice(0, compact ? 5 : 20);

  return (
    <div className="mx-auto w-full max-w-md rounded-xl border border-white/10 bg-white/5 p-4 text-left">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-cyan-300">
            {isWeekly ? "Weekly top distance" : "Worldwide top distance"}
          </p>
          {isWeekly && <p className="mt-1 text-xs text-white/40">Resets every Monday</p>}
        </div>
        <div className="flex rounded-lg bg-black/30 p-1 text-xs">
          <button
            onClick={() => setTab("weekly")}
            className={`rounded px-2 py-1 ${isWeekly ? "bg-cyan-500/20 text-cyan-200" : "text-white/50"}`}
          >
            Weekly
          </button>
          <button
            onClick={() => setTab("worldwide")}
            className={`rounded px-2 py-1 ${!isWeekly ? "bg-cyan-500/20 text-cyan-200" : "text-white/50"}`}
          >
            Worldwide
          </button>
        </div>
      </div>
      {isWeekly && (
        <div className="mb-3 grid grid-cols-3 gap-2 text-center text-xs">
          {PRIZES.map((prize, i) => (
            <div
              key={prize}
              className="rounded border border-white/10 bg-black/20 px-2 py-1 text-yellow-300"
            >
              {i + 1}
              {i === 0 ? "st" : i === 1 ? "nd" : "rd"}: +{prize} coins
            </div>
          ))}
        </div>
      )}
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
              {isWeekly && i < 3 && (
                <span className="ml-2 text-xs text-yellow-300">+{PRIZES[i]}</span>
              )}
            </span>
            <span>{entry.best_distance.toLocaleString()} m</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
