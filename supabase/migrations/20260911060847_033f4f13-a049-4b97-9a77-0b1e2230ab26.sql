CREATE TABLE public.leaderboard (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id uuid NOT NULL UNIQUE,
  name text NOT NULL,
  best_distance integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.leaderboard TO anon;
GRANT SELECT ON public.leaderboard TO authenticated;
GRANT ALL ON public.leaderboard TO service_role;

ALTER TABLE public.leaderboard ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leaderboard is publicly readable"
  ON public.leaderboard FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE INDEX leaderboard_best_distance_idx ON public.leaderboard (best_distance DESC);

CREATE OR REPLACE FUNCTION public.submit_score(_player_id uuid, _name text, _distance integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  clean_name text;
BEGIN
  clean_name := btrim(_name);
  IF clean_name = '' THEN
    RAISE EXCEPTION 'Name is required';
  END IF;
  clean_name := left(clean_name, 16);

  IF _distance IS NULL OR _distance < 0 OR _distance > 10000000 THEN
    RAISE EXCEPTION 'Invalid distance';
  END IF;

  INSERT INTO public.leaderboard (player_id, name, best_distance)
  VALUES (_player_id, clean_name, _distance)
  ON CONFLICT (player_id) DO UPDATE
  SET name = EXCLUDED.name,
      best_distance = GREATEST(public.leaderboard.best_distance, EXCLUDED.best_distance),
      updated_at = now();
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_score(uuid, text, integer) TO anon, authenticated, service_role;