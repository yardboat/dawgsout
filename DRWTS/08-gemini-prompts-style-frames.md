# 08 · Gemini Prompts: World Style Frames (Round 1)
**Purpose:** pick the look of the whole game. Everything else (full map, Joby, dawg, UI) gets drawn into the style you choose here.
**Deliver to:** `DRWTS/inbox/` as `S1_styleA_v01.png`, `S1_styleB_v01.png`, `S1_styleC_v01.png`
**Reference image:** `DRWTS/reference/leonardtown_dc_reference.png` (the two cartoon maps you sent)

## How to run Gemini (read once)
1. **New chat per prompt.** Gemini drifts in long chats; one chat per asset keeps results consistent.
2. **Attach the reference image every time**, then paste the prompt.
3. Ask for **4 variations** if it offers; pick the best 1 per style.
4. Save as the filenames above and drop them in `inbox/`. Tell me when they're in.
5. Don't fix things in Gemini by chatting more than 2 rounds. If it's off, regenerate, and tell me what's wrong so I can tighten the prompt.

## Shared rules (already baked into each prompt)
Strict top-down plan view · streets on a straight horizontal/vertical grid · streets much lighter than the blocks · no real logos or brand names · no photos or likenesses of real people · no text except where stated.

---
## Prompt A: "Faithful" (closest to the Leonardtown/DC maps)
```
Use the attached image only as a STYLE reference: hand-inked pen outlines with bright marker and watercolor fills, saturated greens for trees, warm tan and red for buildings, a cheerful cluttered cartoon-map feel.

Draw a small fragment of a cartoon map of a college-town downtown, 2:3 portrait aspect ratio. Strict TOP-DOWN plan view, no perspective tilt. Show two wide streets crossing in a plus-shaped intersection, running perfectly straight horizontally and vertically. Streets are a light cream/tan color with thin dashed lane lines, and clearly lighter than everything around them. Between the streets, four city blocks packed with cartoon rooftops (red brick, tan, a green awning or two), tiny trees with round canopies, and a few tiny cartoon cars and people on the streets. Soft drop shadows beside each building.

One empty rectangular plaza of bare pavement near the center (about the size of two cars), kept clear for a game piece to be added later. No text anywhere. No logos, no brand names, no real people. Friendly, charming, game-board readable: if shrunk to a phone thumbnail, the streets must still read clearly as paths.
```

## Prompt B: "Game-board bold" (higher contrast, thicker lines)
```
Use the attached image only as a STYLE reference for hand-drawn pen-and-marker cartoon maps.

Draw a small fragment of a cartoon map of a college-town downtown, 2:3 portrait. Strict TOP-DOWN plan view. Make it read like a video-game playfield: THICK dark pen outlines (about twice the weight of the reference), flat saturated marker colors with only one shading step, and very high contrast between streets and buildings. Streets are bright pale yellow-cream, perfectly straight horizontal and vertical, one tile wide, forming a plus-shaped intersection plus one side street ending in a dead end. City blocks are dense, darker rooftops in warm red, brick orange and teal, with round green tree canopies overlapping the curbs and soft drop shadows. A few tiny cartoon cars and people, drawn small. Leave one empty pavement plaza (two-car size) near the center.

No text, no logos, no real brand names, no real people. It must still read as a clear maze of paths when shrunk to phone thumbnail size.
```

## Prompt C: "Watercolor" (softer, most illustrated)
```
Use the attached image only as a STYLE reference for hand-inked cartoon maps with marker color.

Draw a small fragment of a cartoon map of a college-town downtown, 2:3 portrait. Strict TOP-DOWN plan view. Softer watercolor-wash fills with visible paper texture, loose confident pen outlines, warm late-afternoon light with long gentle shadows. Streets run perfectly straight horizontally and vertically in a plus-shaped intersection and are a pale warm cream, clearly lighter than the blocks. Blocks full of cartoon rooftops, big leafy trees (southern live oaks and dogwoods, pink and white blossoms), tiny cars, tiny people, a hot-dog cart. One empty pavement plaza (two-car size) near the center for a game piece.

No text, no logos, no brand names, no real people. Keep street/block contrast high enough that the streets read as paths at phone-thumbnail size.
```

---
## What I check when you drop them in
- Thumbnail test at 360×540: do the streets read as a maze?
- Orthogonal: no tilted perspective, so a grid can sit on top of it.
- Contrast: streets vs blocks.
- Charm: still fun to look at after a minute.
I'll rank them, you pick. **That's Gate 1.**

## Next prompts (written once you pick)
- **Full map** (1200×1800 portrait), with the Athens layout and landmark list.
- **Street mask** (flat white streets on black, aligned to the map). If Gemini can't align it, I trace the grid by hand in the debug editor.
- **Joby portrait** (traits from your photo; never the photo itself) closed mouth, then an image-edit prompt for the open mouth.
- **Characters:** Gemini is weak at consistent sprite sheets, so I'll ask for **single poses** (front, back, left, right) and animate the stomping waddle in code with squash-and-stretch. Fewer images, more consistent.
