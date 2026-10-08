# 04 · Briefs: Characters, Audio, Engineering
Companion to docs 01–03. Needed by: **Thu 8 Oct, AM** (sprites, audio), **Wed 7 Oct, EOD** (engineering greybox).

---
## A. Character Artist: the Dawg and Nasty Joby
**Style:** match the world art: hand-inked outline, marker fills, chunky and friendly.
**Format:** transparent PNG sprite sheets, power-of-two cells (e.g. 64 × 64 per frame for in-game size; draw at 2× and downsample).

### Player: an original scrappy bulldog
Original design only: no official mascot or trademarked features. White coat, red collar, squished face, determined scowl, big paws. Needs a name (Randall to choose).
- Walk cycles in 4 directions (up, down, left, right), 4 frames each.
- Idle frame; a "bonk" frame for wrong grabs (squashed/dizzy).
- Small celebratory frame for grabbing a correct word.

### Nasty Joby: the villain
Curmudgeon energy: stooped, scowling, pointing finger, grumpy-old-man outfit (cardigan, visor/hat, cane optional). Randall will supply the personal details (see Open Decisions); until then design a generic curmudgeon.
- In-game sprite: walk cycle in 4 directions, 4 frames each, ~1.3× the dawg's size, plus a slow-menace idle.
- **Close-up portrait for the cutscenes:** one tall PNG, front-facing, ~900 × 900, big expressive face, mouth **closed** and **open** variants (two layers) for talking. The engine melts this image procedurally, so no melt frames are needed; clean flat colors and strong outline work best.
- A speech-bubble shape for the caught lines (comic style, hand-lettered feel).

### Acceptance
- Dawg reads at 64 px against the busy map; Joby is visibly bigger and meaner.
- Joby's portrait holds up at full-screen zoom on a phone.

---
## B. Audio / Voice
Everything optional by Friday; text bubbles cover for any missing audio.
| Cue | Spec |
|---|---|
| Word collected | Short bright "pop" with a rising pitch each correct word (5 pitches, one per word) |
| Wrong grab | Short buzzer + a low growl |
| Joby reveal | 2-second ominous sting |
| Chase loop | Tense, upbeat, 8–16 bar loop; speeds up with Joby's ticks if possible |
| Caught | Record-scratch/gong, then each of Joby's 4 lines (VO if time) |
| Win | Joby's **"nooooooo!!!!!!"** (≈ 3 s, long and dramatic) over a melting sound, then a fanfare |
**Format:** mp3 or m4a, small files (< 300 KB each). **Voice tip:** a friend recording on a phone will beat text-to-speech for personality.

---
## C. Engineering (the build agent)
Read doc 02 (architecture) first. Wednesday goal: a **greybox playable** with placeholder art.
**Milestone 1 (Wed):**
- Static site scaffold, canvas that scales to any phone, virtual joystick + keyboard.
- Placeholder 20 × 30 grid, player movement with turn buffering.
- Phrase 1 tokens, collection order, wrong-grab handling.
- Joby spawn, BFS chase, speed ticks, caught → restart.
- `?debug=1` tile-overlay and spawn-point editor.
**Milestone 2 (Thu):** real map/mask pipeline (`mask2grid.js`), sprites, HUD, caught zoom and quote, win melt, audio hooks, landmark overlays.
**Milestone 3 (Fri):** tuning pass using the tunables table in doc 01; iOS Safari + Android Chrome checks; deploy to Vercel; send link.
**Test script (every build):** (1) wrong grab wakes Joby in phase 1; (2) full phrase 1 triggers reveal; (3) each correct phase-2 word bumps Joby's speed; (4) caught plays zoom + one of four lines and restarts; (5) finishing phase 2 plays win; (6) rotating or backgrounding the phone doesn't break state.

---
## D. Open Decisions (Randall, by Wed noon)
1. Nasty Joby: a description of his look and any signature gear.
2. The player dawg: name and any personality quirks.
3. "The Townie Side of Town": a venue, or a zone?
4. Georgia Theatre: scaffolded (2010-accurate) or whole?
5. Who records Joby's voice? (Recommendation: Randall, on a phone.)
