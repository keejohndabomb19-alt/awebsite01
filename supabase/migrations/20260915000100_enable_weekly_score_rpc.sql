-- The app invokes these RPCs from a TanStack server function using the
-- project's publishable key. The deployed runtime does not receive a
-- SUPABASE_SERVICE_ROLE_KEY, so restricting these functions to service_role
-- made every score submission fail before it could update weekly_leaderboard.
-- The functions validate their input and are the only write path for these
-- tables; allow the server function's anon/authenticated database role to run
-- them.
GRANT EXECUTE ON FUNCTION public.submit_score(uuid, text, integer)
  TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_weekly_reward(uuid)
  TO anon, authenticated;
