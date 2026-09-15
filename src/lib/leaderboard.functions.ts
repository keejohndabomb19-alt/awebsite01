import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export interface LeaderboardEntry {
  player_id: string;
  name: string;
  best_distance: number;
}

export interface ScoreSubmissionResult {
  ok: boolean;
  reward: number;
}

const submitSchema = z.object({
  playerId: z.string().uuid(),
  name: z.string().trim().min(2).max(16),
  distance: z.number().int().min(0).max(10_000_000),
});

async function getPublicSupabase() {
  const { createClient } = await import("@supabase/supabase-js");
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient(process.env["SUPABASE_URL"]!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input: RequestInfo | URL, init?: RequestInit) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
          h.delete("Authorization");
        }
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

export const getLeaderboard = createServerFn({ method: "GET" }).handler(
  async (): Promise<LeaderboardEntry[]> => {
    const supabase = await getPublicSupabase();
    const { data, error } = await supabase
      .from("leaderboard")
      .select("player_id, name, best_distance")
      .order("best_distance", { ascending: false })
      .limit(20);

    if (error) {
      console.error("leaderboard read failed", error.message);
      return [];
    }
    return (data ?? []) as LeaderboardEntry[];
  },
);

export const getWeeklyLeaderboard = createServerFn({ method: "GET" }).handler(
  async (): Promise<LeaderboardEntry[]> => {
    const supabase = await getPublicSupabase();
    const weekStart = new Date();
    const daysSinceMonday = (weekStart.getUTCDay() + 6) % 7;
    weekStart.setUTCDate(weekStart.getUTCDate() - daysSinceMonday);

    const { data, error } = await supabase
      .from("weekly_leaderboard")
      .select("player_id, name, best_distance")
      .eq("week_start", weekStart.toISOString().slice(0, 10))
      .order("best_distance", { ascending: false })
      .limit(20);

    if (error) {
      console.error("weekly leaderboard read failed", error.message);
      return [];
    }
    return (data ?? []) as LeaderboardEntry[];
  },
);

export const submitScore = createServerFn({ method: "POST" })
  .validator((input: unknown) => submitSchema.parse(input))
  .handler(async ({ data }): Promise<ScoreSubmissionResult> => {
    // The generated service-role client is not available in this project's
    // deployed server environment. Calling the SECURITY DEFINER RPC through
    // the publishable client keeps this server function operable there.
    const supabase = await getPublicSupabase();
    const { data: result, error } = await supabase.rpc("submit_score", {
      _player_id: data.playerId,
      _name: data.name,
      _distance: data.distance,
    });
    if (error) {
      console.error("score submit failed", error.message);
      return { ok: false, reward: 0 };
    }
    const reward =
      result &&
      typeof result === "object" &&
      "reward" in result &&
      typeof result.reward === "number"
        ? result.reward
        : 0;
    return { ok: true, reward };
  });

export const claimWeeklyReward = createServerFn({ method: "POST" })
  .validator((input: unknown) => z.object({ playerId: z.string().uuid() }).parse(input))
  .handler(async ({ data }): Promise<number> => {
    const supabase = await getPublicSupabase();
    const { data: reward, error } = await supabase.rpc("claim_weekly_reward", {
      _player_id: data.playerId,
    });
    if (error) {
      console.error("weekly reward claim failed", error.message);
      return 0;
    }
    return typeof reward === "number" ? reward : 0;
  });
