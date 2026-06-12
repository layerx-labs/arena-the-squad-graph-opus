# PLAN.md — The Squad Graph: *Six Degrees of the 2026 World Cup*

## 1. The Idea (one concrete project)

**"Six Degrees of the World Cup"** — an interactive web app that turns the provided
WC2026 squad/club dataset into a living social graph and lets anyone explore how every
player at the tournament is connected through shared club history, even across rival nations.

The hook is the *pathfinder*: pick any two players (say Messi and Mbappé) and the app shows
the shortest chain of "played together at the same club in the same season" links between
them — the football version of "Six Degrees of Kevin Bacon." Around that hook sits the full
toolkit the brief asks for: the core club+season roster query, an interactive force-directed
graph, a "strongest club connections" leaderboard, and rich filters.

Why this wins: the rubric has 5 equal-weight criteria and the dataset is a *common baseline*,
so everyone starts with the same data accuracy. The differentiators are **graph correctness**,
**query/viz usefulness**, **code quality**, and **write-up**. This idea maximizes all four while
remaining simple enough to ship reliably: a static, precomputed graph served client-side — no
backend, no database, trivial Vercel deploy, fully self-contained.

## 2. Problem & Target User

- **Problem:** The raw dataset is 1,248 players × thousands of stints. The "who played with whom"
  insight is invisible until you derive it correctly (join on `club_id`+`season`, not name) and
  make it explorable.
- **Target user:** Football fans, journalists, and the peer-reviewing AI agents who need to
  *verify* correctness fast. The app is designed so a reviewer can confirm the graph is right in
  under a minute (built-in sanity-check panel) and then enjoy the exploration.

## 3. Core Features (mapped to brief Core + Stretch)

1. **Club + Season roster query** *(Core requirement)* — pick a club and season; get every listed
   player who was there together, with their WC2026 national team flag. Direct teammate edges shown.
2. **Player profile** — a player's full per-season club history, current club, position, country,
   and their direct "teammates" list grouped by club/season.
3. **Pathfinder / Degrees of Separation** *(Stretch)* — BFS shortest path between any two players,
   rendered as a chain of (player → shared club, season → player) hops. The signature feature.
4. **Interactive force-directed graph** *(Stretch)* — explore the network; click a node to focus its
   neighborhood; color nodes by national team; edge labels show the shared club+season.
5. **Strongest club connections leaderboard** *(Stretch)* — clubs/seasons ranked by how many
   current WC2026 players were teammates there (group size), surfacing the biggest "feeder" rosters.
6. **Filters** *(Stretch)* — by national team, by club country/league, and by era (season range).
7. **"About the data" / coverage panel** — transparently surfaces `gaps.json` (8 players w/o
   history, 437 dropped dateless memberships, 46 birth-date discrepancies, ±1 boundary seasons) and
   shows live counts vs. the documented baselines (~1,248 players, ~1,578 clubs, ~11,000 edges).

## 4. Tech Stack (with one-line justification)

- **Next.js (App Router) + TypeScript** — typed, well-structured React app scores code-quality;
  static export deploys to Vercel in one click.
- **Build-time graph derivation script (Node + TS)** — fetches the *pinned v1.0* data, derives the
  graph, runs sanity checks, and emits a compact `graph.json` bundled into the app. Keeps runtime
  pure-client (no backend/DB to break) and self-contained per the brief's tip.
- **react-force-graph-2d (canvas)** — handles ~1,248 nodes / ~11,000 edges smoothly; canvas, not SVG.
- **Client-side query/BFS in TS** — adjacency map built once in memory; roster lookups O(1) via a
  `(club_id, season)` index; pathfinding via BFS. No server round-trips.
- **Tailwind CSS** — fast, consistent, clean UI; minimal custom CSS to maintain.
- **Vitest** — unit tests for the graph derivation (edge rule, dedup, PSG sanity check) → proves
  graph correctness to reviewers and protects code quality.

## 5. Architecture

```
Data (build time)
  fetch players.json + gaps.json @ pinned v1.0 commit
  → committed to /data in repo (self-contained, immutable bytes)
  → scripts/build-graph.ts:
        index = { (club_id|season): Set<playerId> }      // the core join
        edges  = unique sorted pairs from every group of ≥2
        adjacency = { playerId: [{otherId, club_id, season}] }
        stats   = {players, clubs, edges} validated vs baselines
        → emits public/graph.json  (nodes, edges, adjacency, club index, club/season index)

Frontend (Next.js static, all client-side)
  /            Home: search, pathfinder entry, headline stats, sanity-check badge
  /query       Club + Season roster query (the Core deliverable)
  /player/[id] Player profile + teammates + club history
  /path        Pathfinder: two-player BFS, rendered chain + mini-graph
  /graph       Full interactive force-directed explorer with filters
  /clubs       Strongest connections leaderboard
  /about       Data sources, edge rule, gaps.json coverage, validation numbers

Deploy: Vercel static deployment of the Next.js app.
```

**Graph correctness contract (single source of truth, exactly the brief's rule):**
group players by `(club_id, season)`; every pair within a group of ≥2 is an edge. Join on
`club_id` ONLY (never name — avoids the PSG senior Q483020 vs youth Q2945336 trap). Stints are
already deduped. Winter-transfer overlap is preserved because a player is listed for any season
they touched the club.

## 6. How the idea maps to EACH rubric criterion

- **Data accuracy and coverage (20):** Commit the *exact pinned v1.0 bytes* so the judged data is
  unaltered; surface `gaps.json` honestly on /about; show live counts matching ~1,248 / ~1,578 /
  ~11,000 baselines. Faithfulness + transparency = top marks even on the common baseline.
- **Graph correctness (20):** Derivation is the brief's reference algorithm verbatim, joined on
  `club_id`+`season`, dedup-safe, with a Vitest suite asserting the PSG 2023-24 sanity check
  (Vitinha, Nuno Mendes, Gonçalo Ramos present; João Neves absent) and that edge count ≈ 11,000.
  A visible "Sanity check ✓" badge in the app lets reviewers confirm instantly.
- **Query and visualization usefulness (20):** Three complementary modes — the required club+season
  query, the memorable Six-Degrees pathfinder, and an interactive filterable graph + leaderboard.
  Covers the Core deliverable AND all four stretch goals.
- **Code quality (20):** TypeScript, clear module split (data build vs. UI), pure functions for
  graph logic, unit tests, a thorough README explaining how the graph is built.
- **Write-up clarity (20):** README + TAIKAI page explain the edge rule, the name-join trap and how
  we avoid it, the architecture, data provenance (pinned commit), and a usage walkthrough with the
  PSG verification example.

## 7. Build-phase milestones

1. **Scaffold** Next.js + TS + Tailwind; commit pinned `players.json` + `gaps.json` to `/data`.
2. **Graph build script** + Vitest tests (PSG sanity check, edge-count baseline, name-join guard);
   emit `public/graph.json`.
3. **Core query page** (club + season → roster) — satisfies the mandatory deliverable first.
4. **Player profile** + **Pathfinder (BFS)** pages.
5. **Interactive force-directed graph** with country coloring + filters.
6. **Strongest-connections leaderboard** + **/about** coverage page with live validation numbers.
7. **README** (setup + how the graph is built) and polish; **deploy to Vercel**.
8. **TAIKAI write-up** drafted from README.

## 8. Definition of Done

- Repo `layerx-labs/arena-the-squad-graph-opus` pushed with full source + README.
- Pinned dataset committed; `npm run build:graph` regenerates `graph.json`; Vitest passes including
  the PSG 2023-24 sanity check and ≈11,000-edge baseline.
- Live Vercel URL works: club+season query returns correct rosters; pathfinder finds shortest chains;
  graph renders and filters; leaderboard and /about pages load.
- TAIKAI project page published with what/approach/data/architecture/how-to-use.
- All five rubric criteria explicitly addressed and verifiable by a peer reviewer in minutes.
