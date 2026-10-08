# 03 · Brief: World Designer / Concept Artist
**Project:** DAWGS OUT (working title), a mobile maze game
**Needed by:** Wed 7 Oct, end of day (v1). Revisions Thu AM.
**Reference:** the attached cartoon maps (Historic Leonardtown; Welcome to Washington, D.C.).

## One line
A hand-inked cartoon map of **downtown Athens, GA, circa 2010**, drawn as a Pac-Man-style street maze. Players run its streets on a phone to grab words of a chant.

## Style (from the references)
- Hand-drawn pen outlines with marker/watercolor fills: saturated greens for trees and lawns, warm tans and reds for buildings, bright sky-blue water.
- Chunky, hand-lettered yellow title type with black outline (the "WASHINGTON, D.C.!" treatment). Compass rose in a corner.
- Small cartoon vehicles and tiny people on streets. Friendly, cluttered, charming, never grim.
- Optional: UGA red-and-black accents on a few awnings, banners and flags. Do not draw any official logos or trademarked marks.

## The critical constraint: it's a game board
This is not a pretty poster. It's a playfield. A strict mobile layout means:
1. **Portrait canvas: 1200 × 1800 px** (20 × 30 tiles at 60 px). Keep 120 px of calm margin at the top and bottom for the in-game HUD.
2. **Strict top-down plan view.** Streets run on a clean horizontal/vertical grid; no perspective tilt, no rotated blocks. (The references are oblique aerials. Keep their charm in the *drawing style*, but draw our streets orthogonally so the maze lines up.)
3. **Streets must read instantly as corridors.** Roads are a light, high-contrast color against darker, busy city blocks. Corridor width is 1 tile (≈ 60 px), with a few 2-tile plazas. Block interiors are solid buildings, trees, and parking: no walkable space.
4. **Pac-Man logic, Athens skin.** 6–8 east-west streets and 5–6 north-south streets, with some dead ends, loops, and one or two wrap-around side exits. Intersections every 3–5 tiles. Recognizable beats survey-accurate: simplify the real grid into a satisfying maze.
5. **Depth.** Add soft drop shadows, tall buildings that "lean" slightly over the street edge, and tree canopies overlapping curbs. Landmarks are delivered **as separate transparent PNGs** (below) so the characters can pass *behind* rooftops, awnings and the Arch.

## Layout anchors (approximate; stylize freely)
Downtown Athens centers on **College Ave** as the main north–south spine, with **Broad St** along the southern edge and the campus beyond it. **Clayton St** and **Washington St** are the east–west bar-and-shop streets. **Lumpkin St** runs along the west side.
- **The Arch** (UGA's iconic gate), at College Ave and Broad St, at the bottom of the map. Bottom-center is the player start area.
- **40 Watt Club**, at Washington St and Pulaski St (west side).
- **Georgia Theatre**, on Lumpkin St between Clayton and Washington. *Period detail for 2010: the venue burned in June 2009 and was under reconstruction until 2011, so draw it scaffolded/tarped with a "coming back" banner.* Confirm with Randall if he'd rather show it whole.
- Remaining landmarks (Randall's list): **City Bar, Sideways, Buddha Bar, The Townie Side of Town, Bourbon Street, Last Resort.** Place these on the Clayton/Washington corridors at your discretion and balance them around the map so every quadrant has something to look at. *Locations not independently verified; use judgment and a map reference. Authenticity of storefront look is a bonus, not a blocker.*
- Fun extras if time allows: the Athens courthouse / City Hall plaza with its double-barreled cannon, a record store, a coffee shop, and a hot dog stand.

## Deliverables
| File | Spec |
|---|---|
| `map_beauty.png` | 1200 × 1800, full illustrated map, **without** the overlay landmarks baked into the roofs of the overlap zones (see below) |
| `map_mask.png` | 1200 × 1800, flat 2-color: white = walkable street, black = blocked. Must align pixel-for-pixel with the beauty map. Clean edges, no gradients |
| `landmarks/<name>.png` | One transparent PNG per landmark, drawn at final scale, with a note of its top-left x,y on the beauty map. Only the part that should overlap characters (roofs, signs, the Arch top) |
| `landmarks.json` | `{ "name": "...", "x": 0, "y": 0, "w": 0, "h": 0 }` per sprite, plus the walkable corridor each one faces |
| `token_sign.png` | Template for the word-token plaque (see below), plus a variant for the red wrong-grab flash |
| `title_card.png` | Optional: game title in the yellow lettering style, ~1000 px wide |

## Word tokens
Ten words appear over the game (five per phrase). Design a **chunky yellow hand-lettered plaque** in the same style as the map's title lettering: roughly 2 tiles × 1 tile (120 × 60 px), black outline, slight shadow, readable at phone size. The engine overlays the actual text, so the plaque art is blank, with a hint of glow so it pops off the street.

## Acceptance checklist
- [ ] Mask and beauty map align (flip between them at 50% opacity to check).
- [ ] A phone-sized thumbnail (≈ 360 × 540) still reads as a clear street maze.
- [ ] At least 6 recognizable Athens landmarks, each with its own overlay PNG.
- [ ] Still fun to look at after 60 seconds of play: small gags tucked into corners.

## Don't
- Don't use isometric or tilted perspective for the street grid.
- Don't use official UGA logos, the real mascot, or other trademarked marks.
- Don't make streets low-contrast; the player must see where they can run.
- Don't place text in the map's ground art that could be confused with word tokens.
