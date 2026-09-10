# Stop the ball drifting back to the middle

## What's happening now

When you steer left or right with the keyboard and then let go, the ball slowly slides back toward the centre of the track on its own. That isn't intentional physics — it's a leftover from the touch-steering code.

The game keeps a "target position" that only the touch/swipe controls ever update. It starts at dead centre and never changes when you use the keyboard, so the moment you release the arrow keys the ball is quietly pulled back to that centre value.

## The fix

Keep the ball wherever you leave it:

- When you release the steering keys, the ball keeps its current position and just coasts to a stop through the existing friction — no pull toward the middle.
- Touch/swipe steering keeps working exactly as it does today, since it sets the target as you drag.
- Keyboard steering keeps the target in sync with the ball's actual position, so switching between keyboard and touch mid-run doesn't cause a sudden jerk.

Everything else — the sideways acceleration, the top steering speed, the track edge limits, the ball's roll animation — stays the same.

## Technical detail

In `src/components/SlopeGame.tsx`, the steering block currently runs `lateralPos += (targetLateral - lateralPos) * 5 * delta` whenever no key is held, and `targetLateral` is only assigned by the touch handlers (initial value `0`). Change so that keyboard input writes `targetLateral = lateralPos` each frame it is active, and the idle re-centring lerp only applies when touch input has set a target more recently than the last key press (tracked with a small `lastInput` flag of `"key" | "touch"`). Lateral clamping to the track bounds is unchanged.
