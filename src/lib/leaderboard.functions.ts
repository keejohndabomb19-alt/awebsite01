import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export interface LeaderboardEntry {
  player_id: string;
  name: string;
  best_distance: number;
}

const submitSchema = z.object({
  playerId: z.string().uuid(),
  name: z.string().trim().min(2).max(16),
  distance: z.number().int().min(0).max(10_000_000),
});

export const getLeaderboard = createServerFn({ method: "GET" }).handler(
  async (): Promise<LeaderboardEntry[]> => {
    const { createClient } = await import("@supabase/supabase-js");
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
    const supabase = createClient(process.env["SUPABASE_URL"]!, key, {
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

export const submitScore = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => submitSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.rpc("submit_score", {
      _player_id: data.playerId,
      _name: data.name,
      _distance: data.distance,
    });
    if (error) {
      console.error("score submit failed", error.message);
      return { ok: false as const };
    }
    return { ok: true as const };
  });
