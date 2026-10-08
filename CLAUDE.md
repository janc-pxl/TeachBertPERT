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
- Single-page scroll layout (all sections on one page, nav links are anchor scrolls)
- Interactive elements: interactive PERT diagram builder
- Clean, modern design
- Max-width: 1100px (optimized for 1920x1080 student screens)

## Architecture

The app lives in `teachpert-next/` — a **Next.js 15 + TypeScript + Tailwind v4** project with static export.

`teachpert.html` in the root is the original single-file prototype (archived reference).

### Tech stack
- **Framework**: Next.js 15 (App Router), static export (`output: 'export'`)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 (CSS-native `@theme inline` config) + manual SVG CSS in `globals.css`
- **Fonts**: `next/font/google` (Raleway 600–900)
- **State**: `useState` / `useEffect` per component (no global state)
- **SVG builder**: Imperative via `useRef` + `useEffect` (avoids rewriting 500+ lines of battle-tested SVG event code)
- **Hosting**: GitHub Pages via `gh-pages` branch (`.github/workflows/deploy.yml`)

### Dev commands (run inside `teachpert-next/`)
```bash
npm run dev    # development server on localhost:3000
npm run build  # production build + type check (outputs to out/)
```

### File structure
```
teachpert-next/src/
├── app/
│   ├── layout.tsx          # NavBar, Footer, Raleway font, metadata
│   ├── page.tsx            # Main page — all sections
│   └── globals.css         # Tailwind @theme + SVG-specific CSS
├── components/
│   ├── layout/
│   │   ├── NavBar.tsx      # Sticky nav with hamburger menu + IntersectionObserver scroll-spy
│   │   └── Footer.tsx      # PXL logo + address
│   ├── theory/
│   │   └── TheorySection.tsx
│   ├── demo/
│   │   └── DemoSection.tsx
│   ├── exercises/
│   │   ├── Exercise1.tsx   # Pre-built static diagram + validation
│   │   ├── Exercise2.tsx   # Pre-built with dummy edges
│   │   ├── Exercise3.tsx   # Two-step: TECalc + builder
│   │   ├── Exercise4.tsx   # Builder only
│   │   └── Exercise5.tsx   # Two-step: TECalc + builder
│   └── playground/
│       └── Playground.tsx
└── lib/
    └── pert/
        ├── types.ts             # PertNode, PertEdge, Activity, BuilderConfig
        ├── createPertBuilder.ts # SVG builder factory (imperative DOM)
        ├── algorithms.ts        # computeTE, computeTL, canReach, toRoman
        └── download.ts          # downloadSvgAsJpg
```

### SVG builder approach
`createPertBuilder` is a factory that takes a config object and operates directly on the DOM. In React components it is called inside `useEffect` after the SVG element mounts:
```tsx
useEffect(() => {
  if (!svgRef.current) return;
  const builder = createPertBuilder({ ...config, svgEl: svgRef.current });
  return () => builder.destroy();
}, []);
```
CSS uses `ex1-`, `ex2-`, `ex3-`, `ex4-`, `ex5-`, `play-` prefixes for IDs and classes (same as the original).

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
- Project duration: 30 days
- Critical path: Act 1 → Act 4 → Act 6 → Act 9 → Act 11 → Act 12

### Playground — Free-form PERT builder
- No predefined activities — students enter activity names and durations freely
- Same builder UI as exercises (toolbar, SVG canvas, nodes, edges, 0-lines)
- Popup has text input for activity name + editable number input for duration (vs dropdown in exercises)
- No validation yet (future feature) — only a Reset button
- Canvas: 960x500, node labels use Roman numerals (I–XX)

## Validation design principles
- **Don't enforce exact node/dummy counts** — students may use valid alternative topologies with extra intermediate nodes and dummy edges. Only enforce the activity edge count.
- **Dynamic critical path computation** — since students build their own networks, critical edges are computed at validation time: an edge is critical if both endpoints have TE=TL and the edge is "tight" (fromTE + dur = toTE). This works for activity edges AND dummy edges.
- **Don't give unnecessary hints** — feedback messages say "niet aangeduid" / "niet volledig" / "niet correct" without revealing counts of missing edges.
- **Predecessor validation** uses `canReach()` graph traversal, which naturally handles dummy edges as intermediate hops.
- **No extra dependencies** (`hasExtraDependency()` in `lib/pert/validation.ts`, ex3/4/5): an activity that is not a (transitive) predecessor must not reach the activity's start node. Without this, networks like "E after F" pass, because TE/TL are computed on the student's own (wrong) graph.
- **Structure** (`structureErrors()`, ex3/4/5): no two edges between the same pair of nodes (either direction); multiple start and end nodes are allowed. The builder also refuses to draw such a duplicate.
- **Wrongly selected critical-path edges cost a point** (`score += max(0, correct - wrong)`), so a full score requires exactly the critical edges selected.
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
- Delete tool asks for confirmation: `createPertBuilder` builds its own `.ex3-confirm-popup` (no JSX needed per exercise), highlights the target plus a node's connected arrows in amber + dashed (`.delete-pending`, amber marker `exN-m-del`; never red, which means critical path), focuses "Annuleer" by default; Escape or a click on the canvas cancels. Message is built from text nodes (labels can be user input).
- `pxl-logo-64.png` — resized (64x64) PXL logo used in nav bar and footer. **Must be imported as a module** (`import pxlLogo from "../../../public/pxl-logo-64.png"`) — NOT as a string path. String paths don't get the `basePath` prefix in static export, causing 404s on GitHub Pages.

## Ben (begeleider)
- Poses in `src/assets/ben/*.webp` (cropped/resized from the supplied PNGs), imported as modules in `components/ben/Ben.tsx` (basePath-safe). Decorative: `alt=""`, the HTML text carries the message.
- Fixed placements: welcoming (Theorie header), explaining (wachttijd vs schijnactiviteit note, both demo explanation panels), thinking (Playground header). Never inside diagrams/canvas.
- `components/ben/BenFeedback.tsx` replaces the feedback div under the check buttons (must directly follow the `.ex1-controls` row). Pose comes only from the existing check result: `success` class → `successPose` (`completed` for a whole exercise, `encouraging` for te step 1 and Playground), otherwise `explaining`; no Ben before the first check. Any change in the `watch` area hides Ben until the next check (no stale success). Step-1 Ben is suppressed once the whole exercise succeeds.

## Theorie-illustraties
- `components/theory/TheoryArt.tsx` + `src/assets/theorie/*.webp` (3:2, soft alpha kept). Decorative concept art only (`alt=""`), never a technical PERT diagram or exact time measurement.
- Placements: projectplanning left inside the PERT definition (Ben welcomes top-right, so the two don't stack), wachttijd at the bottom of the Wachttijd concept card (technical arrow example kept), tijdsschattingen beside the Tijdsfactor intro, kritieke-route beside the Kritieke pad definition. On mobile (≤640px) art sits above the text at ~110px.

## Styling (PXL Hogeschool huisstijl)
- Based on `2025_10_huisstijlhandboek.pdf`
- **Colors**: PXL zwart `#030203` (primary/text), PXL goud `#AE9A64` (UI accents), red `#e63946` (critical path in diagrams)
- **Fonts**: Raleway (Google Fonts, 600–900 weights) for headings; Arial/system-ui for body text
- **CSS design tokens**: `--primary`, `--accent` (red, diagrams only), `--gold` (UI accents), `--green`, `--blue`, `--orange`, `--bg`, `--card`, `--border`, `--text`, `--muted`
- **Gold accents** used for: nav active indicator, section badges, definition block borders/labels, summary toggles, instruction borders
- **Diagram colors untouched**: node backgrounds, edge strokes, input validation colors unchanged
- **Nav bar**: black background with PXL logo (`pxl-logo-64.png`) + "PERT" text + hamburger menu (dropdown, closes on outside click / Escape, bars animate to X). CSS classes in `globals.css`: `.nav-hamburger`, `.nav-dropdown`, `.nav-dropdown.open`.
- **Footer**: black background with PXL logo + address (Elfde-Liniestraat 24, B-3500 HASSELT)
