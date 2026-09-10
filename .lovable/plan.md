# Add Shield, Double Coins, and Dodge Combos

## What will change
- Add shield and double-coin pickups directly onto the track, with distinct 3D shapes and colors.
- Make collected shields protect against crash blocks for a short time, matching the existing invincibility behavior.
- Make double coins multiply coin pickups for a short time.
- Track consecutive blocks safely passed, raise the combo multiplier, and add a capped speed bonus as the combo grows.
- Reset the combo when the player hits a non-fatal block, uses a shield on a crash block, falls behind, crashes, or restarts.
- Show active pickup timers, combo count, multiplier, progress, and speed bonus clearly during play.
- Update the start guide so the new pickups and combo rules are visible before playing.

## Technical details
- Extend the existing Three.js object pool/lifecycle with collectible pickup meshes and proper spawn, movement, recycling, reset, and cleanup handling.
- Mark blocks once counted as dodged so each contributes only once.
- Keep permanent coins and the top score saved as they are now; active effects and combos remain per-run.
- Validate the live game at desktop and mobile sizes, including pickup collection, combo growth/reset, restart, and clean runtime logs.
