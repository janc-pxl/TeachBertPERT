# Project: Interactive Learning Webapp

## Goal
Build an interactive webpage that teaches students PERT (Program Evaluation and Review Technique).

## Source materials
- `pert.md` — contains the lesson content and structure
- `501362.pdf` — additional reference material
- `001 - Algemene uitleg PERT.jpg`, `002 - Oefening 1.jpg`, `003 - Oefening 2.jpg`, `004 - Oefening 3.jpg`, `005 - Oefening 4.jpg` - solutions to exercises from the lesson content
- `002 - Oefening 1 - with labels.png` the solution to exercise 1, with labels for activities added.
- `003 - Oefening 2 - with labels.png` exercise 2, with labels for activities added.
- `solution 3.png`, `solution 3 - alternative with dummy.png` — two valid solutions for exercise 3
- `solution 4 - PERT.png`, `solution 4 - PERT Variant with dummy.png` — two valid solutions for exercise 4
- `2025_10_huisstijlhandboek.pdf` a document describing the look and feel of all our company websites
- `1314_logo_pxl_bol_witrand.png` the PXL logo

## Requirements
- Single-page HTML/CSS/JS app (no framework, no build step)
- Interactive elements: interactive PERT diagram builder
- Clean, modern design
- Max-width: 1100px (optimized for 1920x1080 student screens)

## Architecture
- Everything in a single file: `teachpert.html` (HTML + CSS + JS)
- Each exercise is encapsulated in its own JavaScript IIFE to avoid global scope pollution
- CSS uses `ex1-`, `ex3-` class prefixes; element IDs use `ex1-`, `ex2-`, `ex3-`, `ex4-` prefixes
- SVG-based diagrams with foreignObject for input fields inside nodes

## Exercises overview

### Oefening 1 — Pre-built PERT diagram
- 11 nodes, 14 edges (activity A through N) with descriptions and durations (in days)
- Students fill in TE/TL values and click edges to select the critical path
- Edge labels show two lines: activity name + duration (using tspan)
- Critical path: `1-3, 3-5, 5-8, 8-10, 10-11`

### Oefening 2 — Pre-built PERT diagram
- 10 nodes, 13 regular edges (A-M) + 2 dummy edges (8→2, 9→6)
- Dummy edges rendered with dashed stroke (`stroke-dasharray: 8 4`), lighter color `#bbb`, "0" label
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

## Validation design principles
- **Don't enforce exact node/dummy counts** — students may use valid alternative topologies with extra intermediate nodes and dummy edges. Only enforce the activity edge count.
- **Dynamic critical path computation** — since students build their own networks, critical edges are computed at validation time: an edge is critical if both endpoints have TE=TL and the edge is "tight" (fromTE + dur = toTE). This works for activity edges AND dummy edges.
- **Don't give unnecessary hints** — feedback messages say "niet aangeduid" / "niet volledig" / "niet correct" without revealing counts of missing edges.
- **Predecessor validation** uses `canReach()` graph traversal, which naturally handles dummy edges as intermediate hops.
- **TE/TL validation** uses `computeTE()` / `computeTL()` which traverse the actual student-built graph, so they work correctly for any valid topology.

## Edge selection (critical path)
- In exercises 1 & 2: clicking an edge toggles selection (uses CSS class `.ex1-edge-line.selected`)
- In exercises 3 & 4: clicking an edge in "Selecteer" mode toggles selection via direct SVG attribute changes (stroke color, width, marker, label fill) since edges are dynamically created
- Selected edges turn accent red (`var(--accent)`) with thicker stroke and red arrow markers (`ex3-m-sel` / `ex4-m-sel`)

## Key technical details
- SVG markers defined per exercise: `exN-m-def` (default gray), `exN-m-dash` (dummy light gray), `exN-m-sel` (selected red), `exN-m-ghost` (drawing preview)
- Node structure: split circle with left half (label), top-right (TE input), bottom-right (TL input) using clip paths
- Edge hit areas: invisible 18px-wide transparent lines for easy clicking
- `toRoman()` helper in ex3 and ex4 IIFEs ensures extra nodes get proper Roman numeral labels
- Edge popup for network builders: dropdown of unused activities, auto-fills duration
