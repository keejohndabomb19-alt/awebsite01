-- The game submits scores through a server function using the publishable key.
-- Do not require a service-role secret for this RPC; otherwise score writes fail
-- before the weekly leaderboard upsert can run.
GRANT EXECUTE ON FUNCTION public.submit_score(uuid, text, integer) TO anon, authenticated;
