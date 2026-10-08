# 02 · Systems Architecture
**Goal:** a small, robust, phone-first web game, built Wed–Thu, shipped Friday. Few moving parts, no framework.

## Stack
| Layer | Choice | Why |
|---|---|---|
| Rendering | HTML5 `<canvas>` 2D | Fast on phones, zero dependencies, easy zoom and melt effects |
| Language | Vanilla JS (ES modules) | No build step; edit and refresh |
| Hosting | Static site on Vercel (via GitHub) | Free, instant links, phone-testable |
| Art | Pre-rendered PNG map + sprite PNGs | Cartoon look comes from art, not code |
| Audio | WebAudio / `<audio>` | Unlock on first tap (iOS rule) |

## System diagram
```
 ARTIST DELIVERABLES                 BUILD TOOL                     RUNTIME (browser)
 ┌──────────────┐   ┌───────────────┐    ┌──────────────┐    ┌───────────────────────────┐
 │ map_beauty   │   │ tools/        │    │ level.json   │    │ main.js   (boot, resize)  │
 │ map_mask     │──▶│ mask2grid.js  │──▶│ grid, spawns │──▶│ game.js   (state machine) │
 │ landmarks/*  │   │ (+ debug view)│    │ landmarks    │    │ maze.js   (grid + BFS)    │
 └──────────────┘   └───────────────┘    └──────────────┘    │ player.js · joby.js       │
                                                             │ words.js  (tokens, rules) │
                                                             │ input.js  (joystick)      │
                                                             │ render.js (layers, camera)│
                                                             │ cutscenes.js (zoom, melt) │
                                                             │ audio.js · ui.js (HUD)    │
                                                             └───────────────────────────┘
```

## Repo layout
```
/index.html
/src/main.js game.js maze.js player.js joby.js words.js input.js render.js cutscenes.js audio.js ui.js
/assets/map_beauty.png  map_mask.png  landmarks/  sprites/  audio/
/data/level.json  phrases.json  joby_lines.json
/tools/mask2grid.js   (Node, runs offline)
/vercel.json (optional)
```

## Game state machine
```
BOOT → TITLE → PLAY_P1 ──(5 words)──▶ JOBY_REVEAL → PLAY_P2 ──(5 words)──▶ WIN_CUTSCENE → WIN
          ▲        │ wrong grab: Joby wakes (still PLAY_P1)        │
          │        └──────────────── caught ──────────┬────────────┘
          └───────────────── restart ◀── CAUGHT_CUTSCENE
```
Each state owns `enter()`, `update(dt)`, `render(ctx)`, `exit()`.

## Key systems
**Maze and movement.** Tile grid (20×30). Entities move continuously between tile centers. Player input is buffered: the requested direction applies at the next legal turn. No pixel-perfect collision; tile logic only.

**Joby AI.** At each tile center, BFS from Joby's tile to the player's tile on the walkable graph (≈600 tiles, trivial). Move one step along the path. Speed from the tick table in `phrases.json`/config. Caught when tile distance < 0.6.

**Word tokens.** `phrases.json` lists words in order. `words.js` places each token on a spawn tile (spawn points from `level.json`, far from the player and from each other). A touch with `token.index === nextIndex` collects; otherwise the wrong-grab event fires (`joby.wake()` or `joby.speedUp()`).

**Rendering layers (back to front).**
1. `map_beauty.png` (street-level ground).
2. Ground effects: token glow, shadows.
3. Entities (player, Joby, tokens), y-sorted.
4. Landmark overlay sprites that visually overlap streets: this is the "depth" occlusion; dawg and Joby pass behind rooftops.
5. HUD (5 word slots, top) and joystick (bottom, on touch).

**Cutscenes.** Pure canvas tricks, no video. *Caught zoom:* ease the camera scale to Joby's portrait, draw a speech bubble, play a line. *Win melt:* draw Joby's portrait in vertical strips and offset each strip downward by a growing, noisy amount while tinting. The scream audio plays over it.

**Input.** Virtual joystick: on touchstart, an anchor is placed under the thumb; drag direction (snapped to 4 axes with a dead zone) sets intended direction. Desktop: arrow keys/WASD for fast testing.

**Mobile gotchas (handled in `main.js` and CSS).** `touch-action: none`; viewport meta with `user-scalable=no`; use `100dvh`; devicePixelRatio-scaled canvas; block pull-to-refresh and double-tap zoom; unlock audio on first tap; pause when the tab is hidden.

## The art-to-gameplay pipeline (the one risky part)
The illustrated map is generated first; the maze is then **traced to match**, so the art never has to obey a grid.
1. Artist delivers `map_beauty.png` and a flat `map_mask.png` (white streets, black blocks, same dimensions).
2. `mask2grid.js` samples the mask into a 20×30 grid and writes `level.json`.
3. A `?debug=1` overlay draws the grid over the art and lets us nudge any tile (click to flip walkable/blocked) and drag spawn points. We fix misalignment by hand, in minutes.
Fallback if the artist's output drifts: hand-author the grid directly in the debug editor over the beauty map.

## Build plan
| When | Milestone | Who |
|---|---|---|
| Tue 6 Oct | Interview, design one-pager, architecture, briefs issued | Claude + Randall |
| Wed 7 Oct | World art v1 + mask delivered; **greybox game** (colored squares on a placeholder grid): movement, tokens, rules, Joby chase | Artist agent / Engineer agent |
| Thu 8 Oct | Real map and landmarks in; sprites; Joby cutscenes (zoom, melt); sound; phone playtest #1 | All |
| Fri 9 Oct | Tuning, bug fixes, deploy to Vercel, phone playtest #2 with a friend, ship by evening | Engineer + Randall |

## Cut list if we slip (in this order)
1. Voice lines (use text bubbles only).
2. Landmark overlay occlusion (landmarks become flat ground art).
3. Speed ramp (fixed Joby speed).
4. Custom sprites (use simple emoji-style placeholders in the art style).
Never cut: the map, the phrase rules, Joby, the melt.

## Risks
| Risk | Mitigation |
|---|---|
| AI-generated map doesn't read as a maze | Brief demands strict top-down plan view and clear street contrast; mask delivered alongside |
| iOS Safari quirks | Test on a real iPhone Wednesday, not Friday |
| Joby feels unfair | Tick table is data-driven; tune in minutes |
| Scope creep | Scope fence in the design doc is the law |
