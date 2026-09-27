-- The worldwide leaderboard is displayed in score order, with player ID as
-- the tie-breaker. Keep that order deterministic and efficiently indexable.
CREATE INDEX IF NOT EXISTS leaderboard_best_distance_player_id_idx
  ON public.leaderboard (best_distance DESC, player_id ASC);
