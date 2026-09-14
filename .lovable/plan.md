# Detailed skins and shop previews

## Goal
Make all six character skins immediately recognizable in motion and let players inspect them before buying or equipping them.

## Changes
- Build each skin as a reusable 3D character made from a main shape plus lightweight detail pieces:
  - **Neon Orb:** glowing core, bright equatorial rings, and subtle energy bands.
  - **Donut:** dough base, raised pink frosting, colorful sprinkles, and a visible center hole.
  - **Lava Core:** dark rocky shell with glowing lava cracks and hot inner accents.
  - **Lucky Dice:** softened ivory cube with contrasting recessed-style pips on every visible face.
  - **Emerald Gem:** layered faceted jewel with brighter edges and a luminous inner core.
  - **Chrome Pill:** polished capsule with segmented bands and contrasting end details.
- Use the same reusable skin builder in the game and the shop so previews match the equipped character.
- Replace shop color dots with compact, continuously rotating 3D previews for every skin.
- Preserve purchasing, equipping, coin balances, saved ownership, collision sizing, shield coloring, and all current prices.
- Properly dispose of generated geometry and materials when switching skins or closing the shop.
- Keep previews responsive and pause or simplify animation when reduced motion is enabled.

## Validation
- Check every skin in the shop at desktop and mobile sizes.
- Buy and equip a skin, then confirm its detailed model appears during play and remains selected after reload.
- Confirm shop controls, coin deductions, gameplay collisions, and shield visuals still work.
- Confirm there are no rendering, console, or build errors.

## Technical details
- Add a shared Three.js skin-model factory that returns a grouped model and supports applying shield/temporary color states without losing decorative details.
- Render shop previews with small isolated Three.js scenes rather than static images, reusing geometry/material patterns and a shared animation lifecycle where practical.
