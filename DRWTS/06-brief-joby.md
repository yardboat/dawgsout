# 06 · Brief: Nasty Joby (items D2, D3, E4)
**Status:** DRAFT v0. Waiting on trait list from Randall's reference photo (section 3).
**Style source:** the Leonardtown / Washington D.C. cartoon maps (hand-inked outline, marker fills). Style bible (B1) governs once approved.

## 1. Who he is
Nasty Joby is the villain of DAWGS OUT, a curmudgeon who appears after the first phrase is complete and hunts the player through downtown Athens. If he catches you, the camera zooms in and he insults you. If you finish the second phrase, he melts, screaming "nooooooo!!!!!!".

He's funny first and scary second. Think "grumpy neighbor yelling at kids on his lawn," not horror.

**His lines (caught):** "I'm the nastiest" · "This is so over" · "Patterson ruined it forever" · "I thought you were better than this."

## 2. Motion and personality
- **Stomping waddle:** heavy, angry, bouncy. Each step plants a foot with a squash-and-stretch bounce. Slower than the dawg, but he never stops.
- Resting posture: hunched, chin forward, one finger always half-raised.
- He grows more furious as he speeds up (faster steps, redder cheeks; optional steam puffs at the top speed tier).

## 3. Look: traits (from Randall's reference; to fill in)
> **Likeness rule:** he is a cartoon archetype *loosely inspired* by someone real. The artist gets **traits, not a photo**, and the result must not read as a portrait or a recognizable face. The link is public.
- Age feel: `[ ]`
- Build / height: `[ ]`
- Hair / facial hair: `[ ]`
- Glasses / hat: `[ ]`
- Signature clothing: `[ ]`
- One exaggerated feature to push: `[ ]`
- One prop (optional): `[ ]`
- Default expression: perpetual scowl, one eyebrow lower than the other.

## 4. Design constraints
- **Silhouette first.** He must be instantly distinct from the dawg at 64 px, even in solid black.
- **Color:** limited palette (4–5 colors) that pops against the map's greens, tans and yellow. He should be the highest-contrast thing on screen after the dawg. Avoid map green and word-plaque yellow as dominant colors.
- **No trademarked marks:** no real team logos or brand names on clothing.
- **Proportion:** big head, small body (about 1.3× the dawg's size on screen), so his face reads at gameplay scale and in the zoom.
- **Hand-inked outline** at the same weight as the dawg's. Flat fills with at most one shading step.

## 5. Deliverables
| ID | File | Spec |
|---|---|---|
| D2 | `D2_joby_sprites_vNN.png` | Transparent. Waddle cycle: 4 directions × 4 frames, plus 1 idle. 64×64 cells, drawn at 2× (128×128) |
| D3 | `D3_joby_portrait_closed_vNN.png`, `D3_joby_portrait_open_vNN.png` | ~900×900, transparent, front-facing bust. Same pose; only the mouth differs. Bold outline, flat color, no fine texture (the engine melts it with strips) |
| D3b | optional | Two extra expressions: sneer, rage |
| E4 | `E4_joby_reveal_vNN.png` | Reveal card: Joby looming, 1080×1920, with room for the text "NASTY JOBY" in the yellow lettering style |

## 6. Process (3 rounds, quick)
1. **Round 1: 4 silhouettes + faces** at thumbnail size, all based on section 3. Randall picks one (A/B/C/D) plus ≤2 changes.
2. **Round 2: full portrait** (D3, closed + open mouth).
3. **Round 3: sprite sheet** (D2), matched to the approved portrait.
Maximum 2 revision rounds on each.

## 7. Acceptance checklist
- [ ] Silhouette distinct from the dawg at 64 px
- [ ] Reads as funny, not frightening
- [ ] Palette pops against the map at phone size
- [ ] Portrait holds up full-screen on a phone
- [ ] Not a recognizable likeness of any real person
- [ ] Files named and sized as above

## 8. Don't
- Don't use a photo of a real person as a reference image.
- Don't add real logos, team marks or brand names.
- Don't draw him gory, horrifying, or cruel; he's a bad-mood cartoon.
- Don't draw detailed texture (it breaks in the melt effect).
