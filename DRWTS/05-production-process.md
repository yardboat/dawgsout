# 05 · Production Process
Companion to docs 01–04. Owner: Claude (architect/assembler). Decider: Randall.

## 1. The loop in one line
**Brief → Generate → Randall picks → Spec check → Drop in `inbox/` → Claude integrates → Preview deploy → Phone check → Lock.**
Design agents never touch the game. They only deliver files to `inbox/`. Claude is the only one who assembles and deploys.

## 2. Asset checklist (what must exist)
Status key: ☐ not started · ◐ in progress · ☑ locked. Priority: **P0** can't ship without · **P1** should have · **P2** nice.

### A. Decisions (Randall) — block everything
| ID | Item | Pri |
|---|---|---|
| A1 | Nasty Joby description (look, gear, vibe) | P0 |
| A2 | Player dawg name + look notes | P0 |
| A3 | Georgia Theatre: scaffolded or whole · "Townie Side of Town" meaning | P1 |

### B. Style bible (Claude drafts, Randall approves) — blocks all art
| ID | Item | Pri |
|---|---|---|
| B1 | Style bible: palette (hex), line weight, lettering style, shadow rule, 3 do/don't pairs, from the Leonardtown/DC references | P0 |
| B2 | One test frame: dawg + Joby + a token plaque on a map fragment, to prove the styles sit together | P0 |

### C. World
| ID | Item | Pri |
|---|---|---|
| C1 | `map_beauty.png` 1200×1800 | P0 |
| C2 | `map_mask.png` (aligned) | P0 |
| C3 | Landmark overlays ×6+ and `landmarks.json` | P1 |
| C4 | Word-token plaque + red wrong-grab variant | P0 |
| C5 | Title card / logo lettering | P1 |
| C6 | Favicon / share image (link preview in texts) | P2 |

### D. Characters
| ID | Item | Pri |
|---|---|---|
| D1 | Dawg sprite sheet (4 dirs × 4 frames, idle, bonk, celebrate) | P0 |
| D2 | Joby sprite sheet (4 dirs × 4 frames, idle) | P0 |
| D3 | Joby portrait, mouth closed + open (for zoom and melt) | P0 |
| D4 | Speech bubble | P1 |

### E. UI
| ID | Item | Pri |
|---|---|---|
| E1 | HUD word-slot bar (5 slots, empty/filled) | P0 |
| E2 | Virtual joystick art | P1 |
| E3 | Title screen + Play button | P0 |
| E4 | Joby reveal card ("he's coming") | P1 |
| E5 | Win screen + Play Again | P0 |

### F. Audio
| ID | Item | Pri |
|---|---|---|
| F1 | Collect pops ×5 (rising), wrong buzz, growl | P1 |
| F2 | Reveal sting, caught gong, win fanfare | P1 |
| F3 | Chase loop | P2 |
| F4 | Joby's 4 caught lines (VO) | P2 |
| F5 | "nooooooo!!!!!!" scream | P1 |

### G. Code and data (Claude)
`phrases.json`, `joby_lines.json`, `level.json` (generated), engine, debug tools, deploy config. Tracked in doc 02.

## 3. Order of work
| # | Stage | Items | Depends on | When |
|---|---|---|---|---|
| 0 | Pipeline: hello-world deploy to a phone-openable link | G | project name from Randall | Tue |
| 1 | Decisions | A1–A3 | Randall | Tue–Wed noon |
| 2 | Style bible + test frame | B1–B2 | A1, A2 | Tue PM–Wed AM |
| 3 | **Map + mask (critical path)** | C1–C2 | B1 | Wed |
| 3′ | *Parallel:* greybox engine on placeholder grid | G | none | Wed |
| 4 | Characters | D1–D4 | B1, A1, A2, map scale from C1 | Wed PM–Thu AM |
| 5 | Tokens, landmarks, UI | C3–C5, E1–E5 | C1 | Thu AM |
| 6 | *Parallel:* audio | F1–F5 | none (only the reveal timing) | Thu |
| 7 | Integration pass 1 (real map + sprites in), phone playtest #1 | all | 3–5 | Thu PM |
| 8 | Tuning, polish, cut list decisions, phone playtest #2, ship | all | 7 | Fri |

Why this order: the map is the long pole because the maze depends on it, so it starts first and the engine is built in parallel on a placeholder grid. Characters wait for the style bible so everything matches. Audio has no dependencies, so it fills gaps.

## 4. Process for any single asset
1. **Ticket.** Claude opens an entry in `ASSETS.md`: ID, brief link, exact spec (size, format, transparency, naming), acceptance checklist, owner, status.
2. **Brief.** Claude issues the brief (docs 03–04 are the templates). Every brief carries: the style bible, the spec, 2 reference images, a do/don't list, and the file name to deliver.
3. **Generate.** The design agent returns 3–4 options at low fidelity first (thumbnails), then full resolution for the pick.
4. **Pick.** Randall chooses with a one-word reply (A/B/C) plus up to 2 changes. No open-ended critique rounds.
5. **Spec check.** Claude runs an automated check on the delivered file: dimensions, transparency, file size, naming, mask-to-beauty alignment where relevant. Failures go back to the agent with the exact error.
6. **Drop.** Final files go into `DRWTS/inbox/` named `ID_name_vNN.ext` (e.g. `C1_map_beauty_v03.png`).
7. **Integrate.** Claude renames to the final path in `assets/`, wires it up, and deploys a preview.
8. **Phone check.** Randall opens the preview on his phone; Claude records the verdict in `ASSETS.md`.
9. **Lock or revise.** Locked assets are frozen. Revisions are capped at **2 rounds per asset** before Friday's cut list decides.

### Ticket template
```
ID:            C1
Name:          map_beauty
Owner:         world-designer agent
Spec:          1200x1800 PNG, no transparency, <4 MB
Depends on:    B1 style bible, A3
Acceptance:    [ ] reads as a maze at 360x540  [ ] aligns with C2  [ ] 6 landmarks
Status:        ☐ / ◐ / ☑      Round: 0/2
Delivered:     inbox/C1_map_beauty_v00.png
Decision:      (A/B/C + changes)
```

## 5. Pipeline setup: what's ready, what I need

### Already in place
- **Vercel** is connected to this session, under the team "Yardboat's projects". I can create a project and deploy from here.
- **Your DRWTS folder** is linked, and the docs are in it. It becomes the project home: `inbox/`, `assets/`, `src/`.
- **Project docs** hold the shared source of truth.
- Your computer has Node 22, npm, git and Python; no Vercel CLI or GitHub CLI.

### What doesn't work from my side
- **GitHub:** the GitHub login in my cloud workspace is invalid, so I can't push to a repo from here.
- **Vercel CLI** isn't installed on your computer.

### The pipeline I recommend
**Direct deploy through the Vercel connection, no GitHub.** I upload the site files straight to a Vercel project and get a preview URL for each build. That's enough for Friday, and it's the fewest steps. Git can be added after Friday if you want history and auto-deploys.

### What I need from you
1. **A project name** (it becomes the link, e.g. `dawgs-out.vercel.app`). Suggest 2–3 options if you like.
2. **Link access:** newly created Vercel projects default to *Vercel Authentication*, which would block friends opening the link. I'll switch it off for this project. Confirm that's fine (the game is public to anyone with the link).
3. **Where design agents deliver:** the default is `DRWTS/inbox/`. If you're using agents outside this session (Midjourney, ChatGPT, etc.), you drop their PNGs there with the filename convention above.
4. **A phone** for testing: one iPhone or Android, with the link saved.
5. **Answers to A1–A3** by Wednesday noon.

### Things I'll set up first (Tuesday, ~1 hour)
- Create the Vercel project and deploy a hello-world page (canvas fills the phone screen, tap makes a colored square).
- Create the folder skeleton and `ASSETS.md` in DRWTS.
- Write the style-bible draft (B1) for your approval.
- Add a one-command asset spec checker.
