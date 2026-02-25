# Project: Interactive Learning Webapp

## Goal
Build an interactive webpage that teaches students PERT (Program Evaluation and Review Technique).

## Source materials (in `source/` folder)
- `source/pert.md` — contains the lesson content and structure
- `source/501362.pdf` — additional reference material
- `source/001 - Algemene uitleg PERT.jpg`, `002 - Oefening 1.jpg`, `003 - Oefening 2.jpg`, `004 - Oefening 3.jpg`, `005 - Oefening 4.jpg` — solutions to exercises from the lesson content
- `source/002 - Oefening 1 - with labels.png` — solution to exercise 1, with activity labels
- `source/003 - Oefening 2 - with labels.png` — exercise 2, with activity labels
- `source/solution 3.png`, `solution 3 - alternative with dummy.png` — two valid solutions for exercise 3
- `source/solution 4 - PERT.png`, `solution 4 - PERT Variant with dummy.png` — two valid solutions for exercise 4
- `source/solution oefening 5.png` — solution for exercise 5
- `source/2025_10_huisstijlhandboek.pdf` — PXL corporate identity / huisstijlhandboek
- `source/1314_logo_pxl_bol_witrand.png` — original PXL logo (high-res)

## Requirements
- Single-page HTML/CSS/JS app (no framework, no build step)
- Interactive elements: interactive PERT diagram builder
- Clean, modern design
- Max-width: 1100px (optimized for 1920x1080 student screens)

## Architecture
- Everything in a single file: `teachpert.html` (HTML + CSS + JS)
- Each exercise is encapsulated in its own JavaScript IIFE to avoid global scope pollution
- CSS uses `ex1-`, `ex3-` class prefixes; element IDs use `ex1-`, `ex2-`, `ex3-`, `ex4-`, `ex5-` prefixes
- SVG-based diagrams with foreignObject for input fields inside nodes

## Exercises overview

### Oefening 1 — Pre-built PERT diagram
- 11 nodes (Roman numerals I–XI), 14 edges (activity A through N) with durations (in days)
- Activity reference table above diagram with full descriptions (Act, Omschrijving, Duur, Voorganger)
- Edge labels use short format: `A (10d)`
- Students fill in TE/TL values and click edges to select the critical path
- Critical path: `1-3, 3-5, 5-8, 8-10, 10-11`

### Oefening 2 — Pre-built PERT diagram
- 10 nodes (Roman numerals I–X), 13 regular edges (A-M) + 2 dummy edges (8→2, 9→6)
- Activity reference table above diagram with full descriptions
- Edge labels use short format: `A (4d)`, dummy edges show `0`
- Dummy edges rendered with dashed stroke (`stroke-dasharray: 8 4`), lighter color `#bbb`
- Students fill in TE/TL and select critical path
- Critical path: `1-3, 3-8, 8-2, 2-5, 5-7, 7-10`

### Oefening 3 — Network builder (Piramide van Chefren)
- **Step 1**: Students calculate te from to/tl/tp values (locked until correct)
- **Step 2**: Students build the PERT network from scratch (add nodes, draw edges, assign activities)
- 8 activities (A-H) with predecessor relationships
- Edge popup auto-fills duration from calculated te values (readonly field)
- Students also fill in TE/TL and select critical path
- Validation is flexible: accepts alternative topologies (e.g., 9 or 10 nodes, 2 or 3 dummies)
- Node labels use Roman numerals via `toRoman()` helper (handles extra nodes beyond LABELS array)

### Oefening 4 — Network builder (H. Oessers digitalisering)
- No Step 1 (durations given directly in weeks)
- 14 activities (numbered 1-14) with predecessor relationships
- 13 nodes minimum (labels I-XIV, skipping V — teacher forgot that label)
- Students build network, fill TE/TL, select critical path
- Validation is flexible: accepts alternative topologies with extra intermediate nodes and dummy edges
- Only checks activity edge count (14), not node or dummy counts
- Activity reference table shown above the builder for student reference
- Canvas is taller (960x600) to fit more nodes
- Project duration: 85 weeks

### Oefening 5 — Network builder (iGame of Thrones)
- **Step 1**: Students calculate te from to/tl/tp values (locked until correct)
- **Step 2**: Students build the PERT network from scratch
- 12 activities (numbered 1-12) with predecessor relationships, durations in **days**
- Same two-step pattern as Exercise 3 (te calculator + locked builder)
- Edge popup auto-fills duration from calculated te values (readonly field)
- Activity labels in popup/edges use `Act N` format (e.g., `Act 1(5)`)
- Canvas: 960x500, node labels use Roman numerals (I–XII)
- Validation is flexible: accepts alternative topologies
- Only checks activity edge count (12), not node or dummy counts
- Project duration: 47 days
- Critical path: Act 1 → Act 4 → Act 6 → Act 9 → Act 11 → Act 12

## Validation design principles
- **Don't enforce exact node/dummy counts** — students may use valid alternative topologies with extra intermediate nodes and dummy edges. Only enforce the activity edge count.
- **Dynamic critical path computation** — since students build their own networks, critical edges are computed at validation time: an edge is critical if both endpoints have TE=TL and the edge is "tight" (fromTE + dur = toTE). This works for activity edges AND dummy edges.
- **Don't give unnecessary hints** — feedback messages say "niet aangeduid" / "niet volledig" / "niet correct" without revealing counts of missing edges.
- **Predecessor validation** uses `canReach()` graph traversal, which naturally handles dummy edges as intermediate hops.
- **TE/TL validation** uses `computeTE()` / `computeTL()` which traverse the actual student-built graph, so they work correctly for any valid topology.

## Edge selection (critical path)
- In exercises 1 & 2: clicking an edge toggles selection (uses CSS class `.ex1-edge-line.selected`)
- In exercises 3, 4 & 5: clicking an edge in "Selecteer" mode toggles selection via direct SVG attribute changes (stroke color, width, marker, label fill) since edges are dynamically created
- Selected edges turn accent red (`var(--accent)`) with thicker stroke and red arrow markers (`exN-m-sel`)

## Key technical details
- SVG markers defined per exercise: `exN-m-def` (default gray), `exN-m-dash` (dummy light gray), `exN-m-sel` (selected red), `exN-m-ghost` (drawing preview)
- Node structure: split circle with left half (label), top-right (TE input), bottom-right (TL input) using clip paths
- Edge hit areas: invisible 18px-wide transparent lines for easy clicking
- `toRoman()` helper in ex3, ex4 and ex5 IIFEs ensures extra nodes get proper Roman numeral labels
- Edge popup for network builders: dropdown of unused activities, auto-fills duration
- `pxl-logo-64.png` — resized (64x64) PXL logo used in nav bar and footer

## Styling (PXL Hogeschool huisstijl)
- Based on `2025_10_huisstijlhandboek.pdf`
- **Colors**: PXL zwart `#030203` (primary/text), PXL goud `#AE9A64` (UI accents), red `#e63946` (critical path in diagrams)
- **Fonts**: Raleway (Google Fonts, 600–900 weights) for headings; Arial/system-ui for body text
- **CSS design tokens**: `--primary`, `--accent` (red, diagrams only), `--gold` (UI accents), `--green`, `--blue`, `--orange`, `--bg`, `--card`, `--border`, `--text`, `--muted`
- **Gold accents** used for: nav active indicator, section badges, definition block borders/labels, summary toggles, instruction borders
- **Diagram colors untouched**: node backgrounds, edge strokes, input validation colors unchanged
- **Nav bar**: black background with PXL logo (`pxl-logo-64.png`) + "PERT" text
- **Footer**: black background with PXL logo + address (Elfde-Liniestraat 24, B-3500 HASSELT)
