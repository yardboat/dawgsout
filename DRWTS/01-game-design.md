# 01 · Game Design One-Pager
**Working title:** DAWGS OUT (rename freely)
**Owner:** Randall · **Architect:** Claude · **Version:** v0.1 · Tue 6 Oct 2026
**Ship target:** playable link by Friday 9 Oct, night

## Pitch
A Pac-Man-style mobile maze game set in a cartoon map of downtown Athens, GA, circa 2010. Scattered through the streets are the words of a chant. Grab them in the right order to win. Complete the first phrase and a villain, Nasty Joby, arrives and hunts you while you collect the second phrase. Finish it and he melts.

## The two phrases
| Phase | Words, in order |
|---|---|
| 1 | DAWGS · RISE · WITH · THE · SUN |
| 2 | TITS · OUT · FOR · THE · DAWGS |

Each phase spawns its own 5 tokens, so THE and DAWGS never collide between phases.

## Core loop
1. Run the street grid (swipe/joystick) and read the signs: 5 word tokens are scattered around the map.
2. Grab them in phrase order. A HUD bar at the top shows 5 slots that fill as you succeed.
3. Phrase 1 done → villain reveal → Nasty Joby spawns and hunts you.
4. Phase 2: same, now with Joby on your tail.
5. Phrase 2 done → crash zoom on Joby → he melts → win screen.

## Rules (v1)
| Rule | Decision | Notes |
|---|---|---|
| Word order | Any token can be touched, but only the **next correct word** collects | No dimming or hints. Players are expected to know the chant. |
| Wrong-order grab | Token flashes red and stays put. **Wakes Nasty Joby early** | If Joby is already out, he gains one speed tick. |
| Joby spawn | Phase 1: only when woken by a wrong grab. Otherwise at phrase 1 completion (reveal card + sting) | If woken early, he's already hunting when the reveal card plays. |
| Joby speed | Starts slow, **+1 tick per correct phase-2 word** and per wrong grab | Joby's top speed (4.7) stays just under the player's (5.0), so he never outruns you; he can only corner you. See tunables. |
| Joby AI | Direct chase: shortest path (BFS) to the player, recomputed at every intersection | No ghost-style scatter in v1. |
| Caught | Camera zooms on Joby, he says one of 4 lines at random, then **the whole game restarts** (back to phase 1) | Brutal and arcade on purpose. |
| Win | Crash zoom on Joby, melt, "nooooooo!!!!!!", win screen with a Play Again button | |
| Lives / score / timer | None in v1 | |

## Nasty Joby's lines (caught)
- "I'm the nastiest"
- "This is so over"
- "Patterson ruined it forever"
- "I thought you were better than this."

## Tunables (starting values, adjust in playtest)
| Parameter | Start |
|---|---|
| Player speed | 5.0 tiles/sec |
| Joby speed ticks | 2.0, 2.6, 3.2, 3.8, 4.4, cap 4.7 tiles/sec |
| Early-wake start | tick 0 (2.0) |
| Maze size | 20 × 30 tiles, portrait |
| Word token size | 2 tiles wide, 1 tile tall |

## Scope fence (not in v1)
Multiple levels, leaderboards, accounts, power-ups, pellets/dots, ghosts other than Joby, native app wrappers.

## Friday "done" definition
1. Opens from a link on an iPhone and an Android in portrait, no zoom or scroll glitches.
2. Both phrases playable end to end with the rules above.
3. Joby chases, catches, and quotes. Win melt plays.
4. The illustrated Athens map and at least 6 landmarks are in.
5. One non-developer friend can finish it without instructions.

## Open decisions (Randall)
- What Nasty Joby looks like (description for the character artist).
- The player dawg's look and name.
- "The Townie Side of Town": a bar, or a zone of the map?
- Georgia Theatre in 2010 (scaffolded/under reconstruction) vs. its pre-fire look.
