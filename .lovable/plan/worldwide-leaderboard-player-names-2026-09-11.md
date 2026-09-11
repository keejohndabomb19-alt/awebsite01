# Worldwide leaderboard + player names

## What players will see

1. **Pick a name on arrival** — first time someone opens the site, a short overlay asks for a nickname (2–16 characters) before they can start. The name is remembered on their device, with a small "change name" option later.
2. **Global leaderboard** — a panel showing the top 20 distances from players worldwide, with rank, name and distance. Visible on the start screen and on the crash screen.
3. **Automatic submission** — when a run ends, the distance is sent to the global list. Only a player's best distance is kept, so the board stays clean.
4. **Your rank** — the crash screen highlights your entry and tells you when you beat your own worldwide best.

Distance uses the existing score counter (it already tracks distance travelled).

## Technical notes

- Enable Lovable Cloud for storage.
- Table `leaderboard`: `id`, `player_id` (device-generated uuid), `name`, `best_distance`, `updated_at`. Unique on `player_id`; grants for anon read plus the write path.
- Reads: public top-20 sorted by `best_distance` desc, through a server function using the publishable key with a narrow `TO anon` SELECT policy.
- Writes: a server function that validates name and distance with Zod, rate-limits absurd values, and upserts only if the new distance beats the stored one.
- Client stores `slope-player-id` and `slope-player-name` in local storage; name gate renders before the game canvas mounts.
- Leaderboard fetched with TanStack Query and refetched after each submitted run.

## Notes

Names are not account-backed, so anyone can pick any nickname; this keeps it friction-free but not spoof-proof.
