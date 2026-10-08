# 09 · Gemini Prompt: Full Athens Map (C1)
**Run this after Gate 1** (once you've picked a style frame).
**Attach two images:** (1) your chosen style frame (`S1_style?_v01.png`), (2) `reference/layout/layout_guide_gemini.png`
**Save as:** `C1_map_beauty_v01.png` in `DRWTS/inbox/`

## Why there's a layout guide
The guide is the maze, drawn by me: cream = streets, dark gray = solid blocks, colored boxes = landmark buildings. Gemini follows it as a strict floor plan, so the finished map lines up with the game grid and we don't have to trace it afterward. `layout_guide_labeled.png` is the same plan with names for you; **don't attach that one** (Gemini would paint the label text into the map).

## The prompt
```
I'm attaching two images.
IMAGE 1 is a STYLE reference: match its hand-inked pen outlines, marker and wash colors, line weight and level of detail exactly.
IMAGE 2 is a STRICT LAYOUT GUIDE (a floor plan). Redraw it as a finished, illustrated cartoon map in the style of image 1, keeping the layout EXACT:
- The cream paths are streets. Keep every street exactly where it is, with the same width, junctions and dead ends. Do not add, remove, shift or curve any street. Strict TOP-DOWN plan view, no perspective tilt, 2:3 portrait aspect ratio.
- Dark gray areas are solid city blocks: fill them with cartoon rooftops, courtyards, trees and parking, with nothing walkable. Keep the contrast: streets must stay clearly lighter than the blocks.
- The two larger golden-cream squares are plazas: a courthouse plaza in the center (fountain and trees, a small antique cannon) and a gateway plaza at the bottom center.
- The colored rectangles are landmark buildings. Draw each in its place, in its footprint, in the same cartoon style, with a blank sign (NO TEXT):
  * Black rectangle outline on the bottom-center plaza: a tall black iron arch gateway on brick pillars, spanning the street.
  * Red: a low brick music club with a small blank marquee.
  * Purple: a tall brick theatre wrapped in scaffolding and blue tarps, a vertical blank blade sign (it is under reconstruction).
  * Blue: a corner bar with a striped awning.
  * Green: a cafe with a patio under string lights.
  * Orange: a narrow bar with sidewalk seating.
  * Pink: a small bar with red paper lanterns.
  * Brown: a balconied New Orleans-style bar with wrought-iron balconies.
  * Teal: a hipster block: a shop with a big hand-painted sign reading "MAX CANADA", a tattoo parlor with a neon sign, fixed-gear bikes locked to racks, mustached hipsters on the sidewalk.
- The top ~7% and bottom ~7% of the image (the dark navy bands) must be a calm, simple decorative border (soft trees, sky or lawn, no buildings, no detail) because a game interface will sit on top.
- Add charm: tiny cartoon cars, bikes and people on the streets (small, never blocking paths), street trees, a hot-dog cart, a few banners. All animals and people must be generic cartoons.
No text or lettering anywhere in the image. No logos, no brand names, no real people. It must still read clearly as a maze of paths when shrunk to a phone thumbnail.
```

## After Gemini returns it
1. If it kept the layout: great. Save as `C1_map_beauty_v01.png` and tell me.
2. If streets moved or it changed the block shapes: regenerate (same chat is fine once, new chat after that). Add one line: *"You moved streets. Reproduce the layout guide EXACTLY."*
3. I overlay the guide at 50% on your output, check alignment, and fix tiles in the debug editor. Small drift is fine; the game grid is the truth, the art is decoration.

## Landmark notes (all positions approximate; unverified except Arch, 40 Watt, Georgia Theatre)
Georgia Theatre is drawn scaffolded for 2010 (decision A3 pending; I can change the line to "whole" in seconds). "The Townie Side of Town" is the hipster block (MAX CANADA, tattoo shop, fixed-gear bikes).
