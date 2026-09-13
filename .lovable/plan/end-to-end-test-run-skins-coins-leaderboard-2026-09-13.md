# End-to-end test run: skins, coins, leaderboard

A scripted play-through in a real browser against the live preview, checking the three things you asked about.

## What the test does

1. Open the site, enter a test name (e.g. `AutoTest`), pick Neon Circuit.
2. Play a real run: start, steer left/right for a while, collect coins, crash.
3. Note the final distance and the coin total shown on the crash screen.
4. Reload the page completely (fresh session) and confirm the coin total and top score are still there.
5. Open the Skin shop, buy the Donut, confirm coins drop by 30 and the ball changes shape in the game.
6. Reload again and confirm the Donut is still equipped and the reduced coin total stuck.
7. Check the worldwide list on the start screen for the test name and the distance from step 3.

## Things to be aware of

- The run writes a real score into the worldwide leaderboard under the test name. If the distance is high it could appear near the top of the public list. I can remove that test row afterwards.
- If a crash doesn't happen naturally within a reasonable time, the script steers into a red block to end the run.

## Technical notes

- Driven with Playwright headless against `localhost:8080`; screenshots at each checkpoint.
- Persistence is checked by full page reloads (localStorage keys `slope-coins`, `slope-highscore`, `slope-skin`, `slope-skins-owned`).
- Leaderboard verification also confirmed directly against the `leaderboard` table row for the test player id.
- Read-only where possible; the only data written is the one test leaderboard row.
