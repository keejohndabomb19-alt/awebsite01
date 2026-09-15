-- Weekly leaderboard and end-of-week rewards. This drops the original
-- void-returning function before recreating it with its jsonb result.
CREATE TABLE IF NOT EXISTS public.weekly_leaderboard (
  week_start date NOT NULL,
  player_id uuid NOT NULL,
  name text NOT NULL,
  best_distance integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (week_start, player_id)
);

GRANT SELECT ON public.weekly_leaderboard TO anon, authenticated;
GRANT ALL ON public.weekly_leaderboard TO service_role;
ALTER TABLE public.weekly_leaderboard ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Weekly leaderboard is publicly readable" ON public.weekly_leaderboard;
CREATE POLICY "Weekly leaderboard is publicly readable"
  ON public.weekly_leaderboard FOR SELECT TO anon, authenticated USING (true);
CREATE INDEX IF NOT EXISTS weekly_leaderboard_score_idx
  ON public.weekly_leaderboard (week_start, best_distance DESC, player_id ASC);

CREATE TABLE IF NOT EXISTS public.weekly_rewards (
  week_start date NOT NULL,
  player_id uuid NOT NULL,
  reward integer NOT NULL CHECK (reward > 0),
  claimed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (week_start, player_id)
);
GRANT ALL ON public.weekly_rewards TO service_role;
ALTER TABLE public.weekly_rewards ENABLE ROW LEVEL SECURITY;

DROP FUNCTION IF EXISTS public.submit_score(uuid, text, integer);
CREATE OR REPLACE FUNCTION public.submit_score(_player_id uuid, _name text, _distance integer)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  clean_name text := left(btrim(_name), 16);
  current_week date := date_trunc('week', now())::date;
  previous_week date := date_trunc('week', now())::date - 7;
  previous_rank integer;
  reward_amount integer := 0;
BEGIN
  IF clean_name = '' THEN RAISE EXCEPTION 'Name is required'; END IF;
  IF _distance IS NULL OR _distance < 0 OR _distance > 10000000 THEN
    RAISE EXCEPTION 'Invalid distance';
  END IF;

  INSERT INTO public.leaderboard (player_id, name, best_distance)
  VALUES (_player_id, clean_name, _distance)
  ON CONFLICT (player_id) DO UPDATE SET name = EXCLUDED.name,
    best_distance = GREATEST(public.leaderboard.best_distance, EXCLUDED.best_distance), updated_at = now();
  INSERT INTO public.weekly_leaderboard (week_start, player_id, name, best_distance)
  VALUES (current_week, _player_id, clean_name, _distance)
  ON CONFLICT (week_start, player_id) DO UPDATE SET name = EXCLUDED.name,
    best_distance = GREATEST(public.weekly_leaderboard.best_distance, EXCLUDED.best_distance), updated_at = now();

  SELECT rank INTO previous_rank FROM (
    SELECT player_id, row_number() OVER (ORDER BY best_distance DESC, player_id ASC) AS rank
    FROM public.weekly_leaderboard WHERE week_start = previous_week
  ) ranked WHERE player_id = _player_id;
  reward_amount := CASE previous_rank WHEN 1 THEN 500 WHEN 2 THEN 250 WHEN 3 THEN 100 ELSE 0 END;
  IF reward_amount > 0 THEN
    INSERT INTO public.weekly_rewards (week_start, player_id, reward)
    VALUES (previous_week, _player_id, reward_amount) ON CONFLICT DO NOTHING;
    IF NOT FOUND THEN reward_amount := 0; END IF;
  END IF;
  RETURN jsonb_build_object('reward', reward_amount);
END;
$$;

CREATE OR REPLACE FUNCTION public.claim_weekly_reward(_player_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  previous_week date := date_trunc('week', now())::date - 7;
  player_rank integer;
  reward_amount integer := 0;
BEGIN
  SELECT rank INTO player_rank FROM (
    SELECT player_id, row_number() OVER (ORDER BY best_distance DESC, player_id ASC) AS rank
    FROM public.weekly_leaderboard WHERE week_start = previous_week
  ) ranked WHERE player_id = _player_id;
  reward_amount := CASE player_rank WHEN 1 THEN 500 WHEN 2 THEN 250 WHEN 3 THEN 100 ELSE 0 END;
  IF reward_amount = 0 THEN RETURN 0; END IF;
  INSERT INTO public.weekly_rewards (week_start, player_id, reward)
  VALUES (previous_week, _player_id, reward_amount) ON CONFLICT DO NOTHING;
  IF NOT FOUND THEN RETURN 0; END IF;
  RETURN reward_amount;
END;
$$;

-- Only server-side service-role calls may submit scores or claim rewards.
REVOKE EXECUTE ON FUNCTION public.submit_score(uuid, text, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.claim_weekly_reward(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_score(uuid, text, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.claim_weekly_reward(uuid) TO service_role;
